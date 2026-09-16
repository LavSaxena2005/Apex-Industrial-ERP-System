const prisma = require('../config/database');
const InventoryService = require('../services/inventoryService');

const getSalesOrders = async (req, res, next) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        quotation: {
          select: { id: true, quotation_number: true, enquiry_id: true },
        },
        creator: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        dispatches: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getSalesOrderById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        quotation: {
          include: {
            enquiry: true,
          },
        },
        creator: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        dispatches: {
          include: {
            items: { include: { product: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm Sales Order and Reserve Stock (ADMIN only)
 * Uses PostgreSQL transaction with FOR UPDATE row locks.
 */
const confirmSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const confirmedOrder = await InventoryService.reserveStockForSalesOrder(id);

    return res.status(200).json({
      success: true,
      message: 'Sales Order confirmed and stock successfully reserved.',
      data: confirmedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatch Sales Order (ADMIN only)
 * Decrements both physical_quantity and reserved_quantity transactionally.
 */
const dispatchSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { vehicle_number, driver_name } = req.body;

    const result = await InventoryService.dispatchSalesOrder(id, {
      vehicle_number,
      driver_name,
      user_id: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: `Sales Order dispatched successfully under ${result.dispatch.dispatch_number}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Sales Order (ADMIN only)
 * Releases reserved stock if order was CONFIRMED.
 */
const cancelSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cancelledOrder = await InventoryService.cancelSalesOrder(id);

    return res.status(200).json({
      success: true,
      message: 'Sales Order cancelled and any reserved stock released.',
      data: cancelledOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
};
