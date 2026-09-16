const prisma = require('../config/database');

class InventoryService {
  /**
   * Get all inventory records with computed available quantities and product details.
   */
  static async getInventoryOverview() {
    const records = await prisma.inventory.findMany({
      include: {
        product: true,
      },
      orderBy: {
        product: { product_code: 'asc' },
      },
    });

    return records.map((rec) => ({
      id: rec.id,
      product_id: rec.product_id,
      product_code: rec.product.product_code,
      product_name: rec.product.product_name,
      category: rec.product.category,
      unit: rec.product.unit,
      base_price: rec.product.base_price,
      physical_quantity: rec.physical_quantity,
      reserved_quantity: rec.reserved_quantity,
      available_quantity: rec.physical_quantity - rec.reserved_quantity,
      updated_at: rec.updated_at,
    }));
  }

  /**
   * Manually update physical stock (ADMIN only).
   */
  static async updatePhysicalStock(productId, physicalQuantity) {
    const pId = parseInt(productId, 10);
    const newPhysical = parseInt(physicalQuantity, 10);

    if (isNaN(newPhysical) || newPhysical < 0) {
      const error = new Error('Physical quantity must be a non-negative integer.');
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      // Lock row
      const [locked] = await tx.$queryRaw`
        SELECT * FROM inventory WHERE product_id = ${pId} FOR UPDATE
      `;

      if (!locked) {
        const error = new Error(`Inventory for product ID ${pId} not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (newPhysical < locked.reserved_quantity) {
        const error = new Error(
          `Cannot reduce physical quantity to ${newPhysical} because ${locked.reserved_quantity} units are currently reserved.`
        );
        error.statusCode = 400;
        throw error;
      }

      const updated = await tx.inventory.update({
        where: { product_id: pId },
        data: { physical_quantity: newPhysical },
        include: { product: true },
      });

      return {
        ...updated,
        available_quantity: updated.physical_quantity - updated.reserved_quantity,
      };
    });
  }

  /**
   * Core Requirement: Inventory Reservation via Transaction + Row-Level Locking (SELECT ... FOR UPDATE)
   *
   * Confirms a Sales Order and reserves stock.
   * Concurrency Safe: Acquires exclusive row locks on all required product inventory rows
   * in ascending product_id order to eliminate deadlocks.
   */
  static async reserveStockForSalesOrder(salesOrderId) {
    const orderId = parseInt(salesOrderId, 10);

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch sales order
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        const error = new Error(`Sales Order with ID ${orderId} not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== 'PENDING') {
        const error = new Error(
          `Cannot confirm Sales Order with status '${order.status}'. Only 'PENDING' orders can be confirmed.`
        );
        error.statusCode = 400;
        throw error;
      }

      // 2. Sort items by product_id to ensure deterministic lock acquisition order across transactions
      const sortedItems = [...order.items].sort((a, b) => a.product_id - b.product_id);

      // 3. Row lock and availability verification for each item
      for (const item of sortedItems) {
        const [lockedInventory] = await tx.$queryRaw`
          SELECT id, product_id, physical_quantity, reserved_quantity 
          FROM inventory 
          WHERE product_id = ${item.product_id} 
          FOR UPDATE
        `;

        if (!lockedInventory) {
          const error = new Error(
            `Inventory record not found for product ${item.product.product_code} (${item.product.product_name}).`
          );
          error.statusCode = 400;
          throw error;
        }

        const available = lockedInventory.physical_quantity - lockedInventory.reserved_quantity;

        if (available < item.quantity) {
          const error = new Error(
            `Insufficient stock for '${item.product.product_name}' (${item.product.product_code}): Available: ${available}, Required: ${item.quantity}.`
          );
          error.statusCode = 400;
          throw error; // Triggers automatic transaction ROLLBACK!
        }
      }

      // 4. All products verified available under lock; update reserved quantities
      for (const item of sortedItems) {
        await tx.inventory.update({
          where: { product_id: item.product_id },
          data: {
            reserved_quantity: { increment: item.quantity },
          },
        });
      }

      // 5. Update order status to CONFIRMED
      const confirmedOrder = await tx.salesOrder.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
        include: {
          items: { include: { product: true } },
          customer: true,
          quotation: true,
        },
      });

      return confirmedOrder;
    });
  }

  /**
   * Dispatch a Confirmed Sales Order.
   *
   * Rules:
   * 1. Order must be in CONFIRMED status.
   * 2. Transactionally reduces physical_quantity AND reserved_quantity.
   * 3. Creates dispatch and dispatch_items audit records.
   * 4. Updates order status to DISPATCHED.
   */
  static async dispatchSalesOrder(salesOrderId, { vehicle_number, driver_name, user_id }) {
    const orderId = parseInt(salesOrderId, 10);

    if (!vehicle_number || !driver_name) {
      const error = new Error('Vehicle number and driver name are required for dispatch.');
      error.statusCode = 400;
      throw error;
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate order
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!order) {
        const error = new Error(`Sales Order with ID ${orderId} not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status === 'CANCELLED') {
        const error = new Error('Cannot dispatch a cancelled Sales Order.');
        error.statusCode = 400;
        throw error;
      }

      if (order.status === 'DISPATCHED') {
        const error = new Error('Sales Order has already been dispatched.');
        error.statusCode = 400;
        throw error;
      }

      if (order.status !== 'CONFIRMED') {
        const error = new Error(
          `Cannot dispatch Sales Order with status '${order.status}'. Order must be 'CONFIRMED' with stock reserved first.`
        );
        error.statusCode = 400;
        throw error;
      }

      // 2. Lock inventory rows and verify reserved stock
      const sortedItems = [...order.items].sort((a, b) => a.product_id - b.product_id);

      for (const item of sortedItems) {
        const [lockedInventory] = await tx.$queryRaw`
          SELECT id, product_id, physical_quantity, reserved_quantity 
          FROM inventory 
          WHERE product_id = ${item.product_id} 
          FOR UPDATE
        `;

        if (lockedInventory.reserved_quantity < item.quantity) {
          const error = new Error(
            `Cannot dispatch ${item.quantity} units of ${item.product.product_code}. Reserved quantity is only ${lockedInventory.reserved_quantity}.`
          );
          error.statusCode = 400;
          throw error;
        }

        if (lockedInventory.physical_quantity < item.quantity) {
          const error = new Error(
            `Cannot dispatch ${item.quantity} units of ${item.product.product_code}. Physical stock is only ${lockedInventory.physical_quantity}.`
          );
          error.statusCode = 400;
          throw error;
        }
      }

      // 3. Decrement both physical_quantity AND reserved_quantity
      for (const item of sortedItems) {
        await tx.inventory.update({
          where: { product_id: item.product_id },
          data: {
            physical_quantity: { decrement: item.quantity },
            reserved_quantity: { decrement: item.quantity },
          },
        });
      }

      // 4. Generate next dispatch number
      const dispatchCount = await tx.dispatch.count();
      const dispatchNumber = `DIS-${String(dispatchCount + 1).padStart(4, '0')}`;

      // 5. Create dispatch record with items
      const dispatch = await tx.dispatch.create({
        data: {
          dispatch_number: dispatchNumber,
          sales_order_id: orderId,
          dispatch_date: new Date(),
          vehicle_number: vehicle_number.trim(),
          driver_name: driver_name.trim(),
          created_by: user_id,
          items: {
            create: order.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // 6. Update order status to DISPATCHED
      const updatedOrder = await tx.salesOrder.update({
        where: { id: orderId },
        data: { status: 'DISPATCHED' },
        include: {
          items: { include: { product: true } },
          customer: true,
          quotation: true,
          dispatches: true,
        },
      });

      return { order: updatedOrder, dispatch };
    });
  }

  /**
   * Cancel a Sales Order.
   * If status is CONFIRMED, releases reserved inventory back to available stock.
   */
  static async cancelSalesOrder(salesOrderId) {
    const orderId = parseInt(salesOrderId, 10);

    return await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!order) {
        const error = new Error(`Sales Order with ID ${orderId} not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status === 'DISPATCHED') {
        const error = new Error('Cannot cancel a dispatched Sales Order.');
        error.statusCode = 400;
        throw error;
      }

      if (order.status === 'CANCELLED') {
        const error = new Error('Sales Order is already cancelled.');
        error.statusCode = 400;
        throw error;
      }

      // If stock was reserved (status === 'CONFIRMED'), release it
      if (order.status === 'CONFIRMED') {
        const sortedItems = [...order.items].sort((a, b) => a.product_id - b.product_id);
        for (const item of sortedItems) {
          // Lock row and decrement reserved_quantity
          await tx.$queryRaw`
            SELECT id FROM inventory WHERE product_id = ${item.product_id} FOR UPDATE
          `;
          await tx.inventory.update({
            where: { product_id: item.product_id },
            data: {
              reserved_quantity: { decrement: item.quantity },
            },
          });
        }
      }

      // Mark order as CANCELLED
      const cancelledOrder = await tx.salesOrder.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      return cancelledOrder;
    });
  }
}

module.exports = InventoryService;
