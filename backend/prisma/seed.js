const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data in reverse order of foreign keys
  await prisma.dispatchItem.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.enquiryItem.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const salesPassword = await bcrypt.hash('Sales@123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Admin)',
      email: 'admin@apex.com',
      password_hash: adminPassword,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'John Doe (Sales Exec)',
      email: 'sales@apex.com',
      password_hash: salesPassword,
      role: 'SALES_USER',
    },
  });

  console.log('Created users: admin@apex.com and sales@apex.com');

  // 2. Customers
  const customer1 = await prisma.customer.create({
    data: {
      company_name: 'ABC Engineering Pvt. Ltd.',
      contact_person: 'Rajesh Sharma',
      mobile: '+91 98765 43210',
      email: 'rajesh@abceng.com',
      city: 'Pune',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      company_name: 'Precision Dynamics Ltd.',
      contact_person: 'Anita Desai',
      mobile: '+91 98234 56789',
      email: 'anita@precisiondyn.com',
      city: 'Mumbai',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      company_name: 'Kirloskar Heavy Industries',
      contact_person: 'Vikram Patil',
      mobile: '+91 99112 23344',
      email: 'vikram@kirloskarhi.com',
      city: 'Bengaluru',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      company_name: 'Apex Turbo Systems',
      contact_person: 'Siddharth Joshi',
      mobile: '+91 97654 32100',
      email: 'sid@apexturbo.com',
      city: 'Ahmedabad',
    },
  });

  console.log('Created 4 customers');

  // 3. Products & Inventory
  const productData = [
    {
      product_code: 'PRD001',
      product_name: 'Industrial Deep-Groove Bearing',
      category: 'Mechanical',
      unit: 'PCS',
      base_price: 850.00,
      physical: 200,
      reserved: 60,
    },
    {
      product_code: 'PRD002',
      product_name: 'Heavy Duty Steel Coupling',
      category: 'Mechanical',
      unit: 'PCS',
      base_price: 1250.00,
      physical: 150,
      reserved: 30,
    },
    {
      product_code: 'PRD003',
      product_name: 'High Pressure Hydraulic Valve',
      category: 'Hydraulic',
      unit: 'PCS',
      base_price: 3200.00,
      physical: 100,
      reserved: 20,
    },
    {
      product_code: 'PRD004',
      product_name: 'Double Acting Pneumatic Cylinder',
      category: 'Pneumatic',
      unit: 'PCS',
      base_price: 4500.00,
      physical: 80,
      reserved: 15,
    },
    {
      product_code: 'PRD005',
      product_name: 'Stainless Steel Flange Adapter',
      category: 'Piping',
      unit: 'PCS',
      base_price: 680.00,
      physical: 300,
      reserved: 50,
    },
    {
      product_code: 'PRD006',
      product_name: 'Helical Industrial Gearbox',
      category: 'Transmission',
      unit: 'PCS',
      base_price: 18500.00,
      physical: 40,
      reserved: 5,
    },
  ];

  const createdProducts = [];
  for (const item of productData) {
    const p = await prisma.product.create({
      data: {
        product_code: item.product_code,
        product_name: item.product_name,
        category: item.category,
        unit: item.unit,
        base_price: item.base_price,
        inventory: {
          create: {
            physical_quantity: item.physical,
            reserved_quantity: item.reserved,
          },
        },
      },
      include: { inventory: true },
    });
    createdProducts.push(p);
  }

  console.log(`Created ${createdProducts.length} products with initial inventory`);

  // 4. Sample Completed Traceable Workflow
  // Enquiry ENQ-0001
  const enquiry1 = await prisma.enquiry.create({
    data: {
      enquiry_number: 'ENQ-0001',
      customer_id: customer1.id,
      enquiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      required_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      notes: 'Urgent requirement for plant maintenance overhaul.',
      status: 'WON',
      created_by: salesUser.id,
      items: {
        create: [
          { product_id: createdProducts[0].id, quantity: 50 },
          { product_id: createdProducts[1].id, quantity: 20 },
        ],
      },
    },
  });

  // Quotation QUO-0001 against ENQ-0001
  // Product 0: 50 * 850 = 42,500. Disc 5% = 2,125. Taxable = 40,375. GST 18% = 7,267.50. Line = 47,642.50
  // Product 1: 20 * 1250 = 25,000. Disc 10% = 2,500. Taxable = 22,500. GST 18% = 4,050. Line = 26,550.00
  // Grand Total = 74,192.50
  const quotation1 = await prisma.quotation.create({
    data: {
      quotation_number: 'QUO-0001',
      enquiry_id: enquiry1.id,
      customer_id: customer1.id,
      valid_until: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'ACCEPTED',
      subtotal: 67500.00,
      total_discount: 4625.00,
      taxable_amount: 62875.00,
      total_gst: 11317.50,
      grand_total: 74192.50,
      created_by: salesUser.id,
      items: {
        create: [
          {
            product_id: createdProducts[0].id,
            quantity: 50,
            unit_price: 850.00,
            discount_percent: 5.00,
            gst_percent: 18.00,
            line_amount: 47642.50,
          },
          {
            product_id: createdProducts[1].id,
            quantity: 20,
            unit_price: 1250.00,
            discount_percent: 10.00,
            gst_percent: 18.00,
            line_amount: 26550.00,
          },
        ],
      },
    },
  });

  // Sales Order SO-0001 against QUO-0001
  const salesOrder1 = await prisma.salesOrder.create({
    data: {
      order_number: 'SO-0001',
      customer_id: customer1.id,
      quotation_id: quotation1.id,
      order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      total_amount: 74192.50,
      status: 'DISPATCHED',
      created_by: salesUser.id,
      items: {
        create: [
          { product_id: createdProducts[0].id, quantity: 50, unit_price: 850.00 },
          { product_id: createdProducts[1].id, quantity: 20, unit_price: 1250.00 },
        ],
      },
    },
  });

  // Dispatch DIS-0001 against SO-0001
  await prisma.dispatch.create({
    data: {
      dispatch_number: 'DIS-0001',
      sales_order_id: salesOrder1.id,
      dispatch_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      vehicle_number: 'MH-12-AB-9876',
      driver_name: 'Ramesh Kumar',
      created_by: admin.id,
      items: {
        create: [
          { product_id: createdProducts[0].id, quantity: 50 },
          { product_id: createdProducts[1].id, quantity: 20 },
        ],
      },
    },
  });

  // 5. Fresh records for immediate live testing
  // Fresh Enquiry ENQ-0002
  await prisma.enquiry.create({
    data: {
      enquiry_number: 'ENQ-0002',
      customer_id: customer2.id,
      enquiry_date: new Date(),
      required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Requesting quotation for pneumatic and hydraulic cylinders.',
      status: 'NEW',
      created_by: salesUser.id,
      items: {
        create: [
          { product_id: createdProducts[2].id, quantity: 10 },
          { product_id: createdProducts[3].id, quantity: 5 },
        ],
      },
    },
  });

  console.log('Database seeded successfully with users, products, inventory, and sample workflow!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
