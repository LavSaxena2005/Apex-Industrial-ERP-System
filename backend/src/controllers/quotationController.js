const prisma = require('../config/database');
const QuotationService = require('../services/quotationService');
const SalesOrderService = require('../services/salesOrderService');

const getQuotations = async (req, res, next) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        enquiry: {
          select: { id: true, enquiry_number: true, enquiry_date: true },
        },
        customer: true,
        creator: { select: { id: true, name: true, role: true } },
        items: {
          include: { product: true },
        },
        sales_order: {
          select: { id: true, order_number: true, status: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: quotations });
  } catch (error) {
    next(error);
  }
};

const getQuotationById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        enquiry: {
          include: {
            items: { include: { product: true } },
          },
        },
        customer: true,
        creator: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        sales_order: {
          include: {
            dispatches: true,
          },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    return res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

const createQuotation = async (req, res, next) => {
  try {
    const { enquiry_id, valid_until, items } = req.body;

    if (!enquiry_id || !valid_until) {
      return res.status(400).json({
        success: false,
        message: 'enquiry_id and valid_until are required.',
      });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(enquiry_id, 10) },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: `Enquiry with ID ${enquiry_id} not found.`,
      });
    }

    // Authoritative backend calculation of line items and grand totals
    const calculation = QuotationService.calculateQuotation(items);

    // Verify all products exist
    for (const item of calculation.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found.`,
        });
      }
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const count = await tx.quotation.count();
      const quotationNumber = `QUO-${String(count + 1).padStart(4, '0')}`;

      const newQuote = await tx.quotation.create({
        data: {
          quotation_number: quotationNumber,
          enquiry_id: enquiry.id,
          customer_id: enquiry.customer_id,
          valid_until: new Date(valid_until),
          status: 'DRAFT',
          subtotal: calculation.subtotal,
          total_discount: calculation.total_discount,
          taxable_amount: calculation.taxable_amount,
          total_gst: calculation.total_gst,
          grand_total: calculation.grand_total,
          created_by: req.user.id,
          items: {
            create: calculation.items.map((it) => ({
              product_id: it.product_id,
              quantity: it.quantity,
              unit_price: it.unit_price,
              discount_percent: it.discount_percent,
              gst_percent: it.gst_percent,
              line_amount: it.line_amount,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          enquiry: true,
        },
      });

      // Update enquiry status to QUOTED if currently NEW
      if (enquiry.status === 'NEW') {
        await tx.enquiry.update({
          where: { id: enquiry.id },
          data: { status: 'QUOTED' },
        });
      }

      return newQuote;
    });

    return res.status(201).json({
      success: true,
      message: 'Quotation created successfully with backend computed totals.',
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuotationStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowedStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { sales_order: true },
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (quotation.sales_order && status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a quotation that has already been converted to a Sales Order.',
      });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });

    return res.status(200).json({
      success: true,
      message: `Quotation status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const convertToSalesOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const salesOrder = await SalesOrderService.convertQuotationToSalesOrder(id, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Quotation converted to Sales Order successfully.',
      data: salesOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  convertToSalesOrder,
};
