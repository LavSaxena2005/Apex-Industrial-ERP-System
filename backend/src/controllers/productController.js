const prisma = require('../config/database');

const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: true,
      },
      orderBy: { product_code: 'asc' },
    });

    const enriched = products.map((p) => {
      const physical = p.inventory ? p.inventory.physical_quantity : 0;
      const reserved = p.inventory ? p.inventory.reserved_quantity : 0;
      return {
        id: p.id,
        product_code: p.product_code,
        product_name: p.product_name,
        category: p.category,
        unit: p.unit,
        base_price: p.base_price,
        created_at: p.created_at,
        physical_quantity: physical,
        reserved_quantity: reserved,
        available_quantity: physical - reserved,
      };
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { product_code, product_name, category, unit, base_price, initial_stock } = req.body;

    if (!product_code || !product_name || !category || !unit || base_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product code, product name, category, unit, and base price are required.',
      });
    }

    const price = parseFloat(base_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Base price must be a non-negative number.',
      });
    }

    const initialPhysical = initial_stock ? parseInt(initial_stock, 10) : 0;

    const product = await prisma.product.create({
      data: {
        product_code: product_code.toUpperCase().trim(),
        product_name: product_name.trim(),
        category: category.trim(),
        unit: unit.toUpperCase().trim(),
        base_price: price,
        inventory: {
          create: {
            physical_quantity: initialPhysical,
            reserved_quantity: 0,
          },
        },
      },
      include: { inventory: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully with inventory record.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, createProduct };
