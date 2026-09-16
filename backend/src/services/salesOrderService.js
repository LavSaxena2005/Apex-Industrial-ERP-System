const prisma = require('../config/database');

class SalesOrderService {
  /**
   * Convert an ACCEPTED Quotation to a Sales Order.
   *
   * Rules:
   * 1. Only ACCEPTED quotation can be converted (DRAFT, SENT, REJECTED -> 400).
   * 2. Quotation cannot be converted multiple times (409 Conflict).
   * 3. Creates Sales Order with items atomically.
   * 4. Updates Enquiry status to 'WON'.
   */
  static async convertQuotationToSalesOrder(quotationId, userId) {
    const qId = parseInt(quotationId, 10);

    // Fetch quotation with items and customer
    const quotation = await prisma.quotation.findUnique({
      where: { id: qId },
      include: {
        items: true,
        enquiry: true,
        sales_order: true,
      },
    });

    if (!quotation) {
      const error = new Error(`Quotation with ID ${qId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Rule 1: Status must be ACCEPTED
    if (quotation.status !== 'ACCEPTED') {
      const error = new Error(
        `Cannot convert quotation with status '${quotation.status}' to Sales Order. Only 'ACCEPTED' quotations can be converted.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Rule 2: Check for existing Sales Order for this quotation
    if (quotation.sales_order) {
      const error = new Error(
        `Quotation ${quotation.quotation_number} has already been converted to Sales Order ${quotation.sales_order.order_number}. Duplicate sales orders are not permitted.`
      );
      error.statusCode = 409;
      throw error;
    }

    // Perform atomic creation
    const salesOrder = await prisma.$transaction(async (tx) => {
      // Double check inside transaction for concurrency safety
      const existing = await tx.salesOrder.findUnique({
        where: { quotation_id: qId },
      });

      if (existing) {
        const error = new Error(
          `Quotation ${quotation.quotation_number} has already been converted to Sales Order ${existing.order_number}.`
        );
        error.statusCode = 409;
        throw error;
      }

      // Generate next order number
      const count = await tx.salesOrder.count();
      const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`;

      // Create Sales Order
      const newOrder = await tx.salesOrder.create({
        data: {
          order_number: orderNumber,
          customer_id: quotation.customer_id,
          quotation_id: qId,
          order_date: new Date(),
          total_amount: quotation.grand_total,
          status: 'PENDING',
          created_by: userId,
          items: {
            create: quotation.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
          quotation: true,
        },
      });

      // Update parent enquiry to WON
      await tx.enquiry.update({
        where: { id: quotation.enquiry_id },
        data: { status: 'WON' },
      });

      return newOrder;
    });

    return salesOrder;
  }
}

module.exports = SalesOrderService;
