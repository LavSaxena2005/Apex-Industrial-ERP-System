const prisma = require('../config/database');

const getCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { company_name: 'asc' },
    });
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { company_name, contact_person, mobile, email, city } = req.body;

    if (!company_name || !contact_person || !mobile || !email || !city) {
      return res.status(400).json({
        success: false,
        message: 'Company name, contact person, mobile, email, and city are all required.',
      });
    }

    const customer = await prisma.customer.create({
      data: {
        company_name: company_name.trim(),
        contact_person: contact_person.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        city: city.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, createCustomer };
