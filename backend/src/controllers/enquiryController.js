const prisma = require('../config/database');

const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: {
        customer: true,
        creator: { select: { id: true, name: true, role: true } },
        items: {
          include: { product: true },
        },
        quotations: {
          select: { id: true, quotation_number: true, status: true, grand_total: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    next(error);
  }
};

const getEnquiryById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        quotations: {
          include: {
            sales_order: true,
          },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    return res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    next(error);
  }
};

const createEnquiry = async (req, res, next) => {
  try {
    const { customer_id, required_date, notes, items } = req.body;

    if (!customer_id || !required_date) {
      return res.status(400).json({
        success: false,
        message: 'customer_id and required_date are required.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry must contain at least one product item.',
      });
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customer_id, 10) },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${customer_id} does not exist.`,
      });
    }

    // Validate items
    const parsedItems = [];
    for (const item of items) {
      const pId = parseInt(item.product_id, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(pId) || isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid product_id and quantity greater than 0.',
        });
      }

      const product = await prisma.product.findUnique({ where: { id: pId } });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${pId} not found.`,
        });
      }

      parsedItems.push({ product_id: pId, quantity: qty });
    }

    // Generate unique enquiry number
    const count = await prisma.enquiry.count();
    const enquiryNumber = `ENQ-${String(count + 1).padStart(4, '0')}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiry_number: enquiryNumber,
        customer_id: parseInt(customer_id, 10),
        enquiry_date: new Date(),
        required_date: new Date(required_date),
        notes: notes ? notes.trim() : null,
        status: 'NEW',
        created_by: req.user.id,
        items: {
          create: parsedItems,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry created successfully.',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEnquiries, getEnquiryById, createEnquiry };
