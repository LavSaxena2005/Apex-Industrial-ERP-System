const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('Industrial Sales & Inventory ERP - Test Suite', () => {
  let adminToken;
  let salesToken;
  let testCustomer;
  let testProduct;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apex.com', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate Sales User
    const salesRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@apex.com', password: 'Sales@123' });
    expect(salesRes.status).toBe(200);
    salesToken = salesRes.body.token;

    // 3. Create or fetch test customer
    testCustomer = await prisma.customer.findFirst();
    if (!testCustomer) {
      testCustomer = await prisma.customer.create({
        data: {
          company_name: 'Test Industrial Corp',
          contact_person: 'Tester',
          mobile: '9876543210',
          email: 'test@corp.com',
          city: 'Pune',
        },
      });
    }

    // 4. Create or fetch test product
    testProduct = await prisma.product.findFirst({
      include: { inventory: true },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // =========================================================================
  // TEST 1: Quotation total is calculated correctly (Authoritative Backend)
  // =========================================================================
  test('Test 1: Quotation total is calculated correctly on backend (ignores client math)', async () => {
    // Create enquiry
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-11-01',
        notes: 'Testing pricing calculation',
        items: [{ product_id: testProduct.id, quantity: 10 }],
      });
    expect(enqRes.status).toBe(201);
    const enquiryId = enqRes.body.data.id;

    // Create quotation: Quantity = 10, Unit Price = 1000, Discount = 10%, GST = 18%
    // Base = 10 * 1000 = 10,000
    // Discount = 1,000
    // Taxable = 9,000
    // GST = 1,620
    // Line Amount / Grand Total = 10,620
    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enquiryId,
        valid_until: '2026-12-01',
        // Deliberately pass fake grand_total to verify backend ignores client total
        grand_total: 999999.99,
        items: [
          {
            product_id: testProduct.id,
            quantity: 10,
            unit_price: 1000,
            discount_percent: 10,
            gst_percent: 18,
          },
        ],
      });

    expect(quoteRes.status).toBe(201);
    const quote = quoteRes.body.data;
    expect(Number(quote.subtotal)).toBe(10000);
    expect(Number(quote.total_discount)).toBe(1000);
    expect(Number(quote.taxable_amount)).toBe(9000);
    expect(Number(quote.total_gst)).toBe(1620);
    expect(Number(quote.grand_total)).toBe(10620);
    expect(quote.status).toBe('DRAFT');
  });

  // =========================================================================
  // TEST 2: Rejected/Draft quotation cannot create a Sales Order
  // =========================================================================
  test('Test 2: Rejected/Draft quotation cannot create a Sales Order', async () => {
    // 1. Create a DRAFT quotation
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-11-01',
        items: [{ product_id: testProduct.id, quantity: 2 }],
      });
    const enquiryId = enqRes.body.data.id;

    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enquiryId,
        valid_until: '2026-12-01',
        items: [{ product_id: testProduct.id, quantity: 2, unit_price: 500 }],
      });
    const quoteId = quoteRes.body.data.id;

    // Attempt to convert DRAFT quotation -> Must be rejected
    const draftConvertRes = await request(app)
      .post(`/api/quotations/${quoteId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(draftConvertRes.status).toBe(400);
    expect(draftConvertRes.body.message).toMatch(/Only 'ACCEPTED' quotations can be converted/i);

    // 2. Change status to REJECTED
    const rejectStatusRes = await request(app)
      .patch(`/api/quotations/${quoteId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'REJECTED' });
    expect(rejectStatusRes.status).toBe(200);
    expect(rejectStatusRes.body.data.status).toBe('REJECTED');

    // Attempt to convert REJECTED quotation -> Must be rejected
    const rejectedConvertRes = await request(app)
      .post(`/api/quotations/${quoteId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(rejectedConvertRes.status).toBe(400);
    expect(rejectedConvertRes.body.message).toMatch(/Only 'ACCEPTED' quotations can be converted/i);
  });

  // =========================================================================
  // TEST 3: Same quotation cannot generate duplicate Sales Orders
  // =========================================================================
  test('Test 3: Same quotation cannot generate duplicate Sales Orders (DB Unique + App Check)', async () => {
    // Create enquiry and quotation
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-11-01',
        items: [{ product_id: testProduct.id, quantity: 5 }],
      });
    const enquiryId = enqRes.body.data.id;

    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enquiryId,
        valid_until: '2026-12-01',
        items: [{ product_id: testProduct.id, quantity: 5, unit_price: 800 }],
      });
    const quoteId = quoteRes.body.data.id;

    // Mark quotation as ACCEPTED
    await request(app)
      .patch(`/api/quotations/${quoteId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // First conversion: Should succeed
    const firstConvert = await request(app)
      .post(`/api/quotations/${quoteId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(firstConvert.status).toBe(201);
    expect(firstConvert.body.data.quotation_id).toBe(quoteId);

    // Second conversion: Must be rejected as duplicate
    const secondConvert = await request(app)
      .post(`/api/quotations/${quoteId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(secondConvert.status).toBe(409);
    expect(secondConvert.body.message).toMatch(/already been converted|duplicate/i);

    // Verify in database that exactly ONE sales order exists for this quotation
    const orderCount = await prisma.salesOrder.count({
      where: { quotation_id: quoteId },
    });
    expect(orderCount).toBe(1);
  });

  // =========================================================================
  // TEST 4: Cannot reserve more than available inventory
  // =========================================================================
  test('Test 4: Cannot reserve more than available inventory', async () => {
    // Create product with small stock
    const customProd = await prisma.product.create({
      data: {
        product_code: `PRD_TEST_${Date.now()}`,
        product_name: 'Test Low Stock Item',
        category: 'Test',
        unit: 'PCS',
        base_price: 100,
        inventory: {
          create: { physical_quantity: 50, reserved_quantity: 0 },
        },
      },
      include: { inventory: true },
    });

    // Create enquiry and quote requesting 80 units (available is only 50)
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomer.id,
        required_date: '2026-11-01',
        items: [{ product_id: customProd.id, quantity: 80 }],
      });

    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiry_id: enqRes.body.data.id,
        valid_until: '2026-12-01',
        items: [{ product_id: customProd.id, quantity: 80, unit_price: 100 }],
      });
    const quoteId = quoteRes.body.data.id;

    await request(app)
      .patch(`/api/quotations/${quoteId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    const soRes = await request(app)
      .post(`/api/quotations/${quoteId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    const salesOrderId = soRes.body.data.id;

    // Admin attempts to confirm/reserve 80 units when available is 50
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${salesOrderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.message).toMatch(/Insufficient stock/i);

    // Verify stock remains untouched
    const inv = await prisma.inventory.findUnique({
      where: { product_id: customProd.id },
    });
    expect(inv.reserved_quantity).toBe(0);
    expect(inv.physical_quantity).toBe(50);

    // Verify sales order remains in PENDING status
    const order = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
    });
    expect(order.status).toBe('PENDING');
  });

  // =========================================================================
  // TEST 5: Unauthorized user cannot perform a restricted operation (RBAC)
  // =========================================================================
  test('Test 5: Unauthorized user (SALES_USER) cannot confirm order or dispatch (403 Forbidden)', async () => {
    // 1. SALES_USER attempts to confirm sales order
    const confirmAttempt = await request(app)
      .post('/api/sales-orders/1/confirm')
      .set('Authorization', `Bearer ${salesToken}`); // Sales user token!

    expect(confirmAttempt.status).toBe(403);
    expect(confirmAttempt.body.message).toMatch(/Forbidden: Action requires role.*ADMIN/i);

    // 2. SALES_USER attempts to dispatch sales order
    const dispatchAttempt = await request(app)
      .post('/api/sales-orders/1/dispatch')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ vehicle_number: 'MH-12-1234', driver_name: 'Driver' });

    expect(dispatchAttempt.status).toBe(403);
    expect(dispatchAttempt.body.message).toMatch(/Forbidden: Action requires role.*ADMIN/i);

    // 3. SALES_USER attempts to update inventory physical stock
    const inventoryPatchAttempt = await request(app)
      .patch('/api/inventory/1')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ physical_quantity: 500 });

    expect(inventoryPatchAttempt.status).toBe(403);
  });

  // =========================================================================
  // TEST 6 (BONUS): Simultaneous inventory reservations (Concurrency race condition)
  // =========================================================================
  test('Test 6 (Bonus): Simultaneous inventory reservations prevent over-reservation (SELECT ... FOR UPDATE)', async () => {
    // Available stock = 100
    const concProduct = await prisma.product.create({
      data: {
        product_code: `PRD_CONC_${Date.now()}`,
        product_name: 'Concurrency Valve',
        category: 'Hydraulic',
        unit: 'PCS',
        base_price: 200,
        inventory: {
          create: { physical_quantity: 100, reserved_quantity: 0 },
        },
      },
    });

    // Helper to create ACCEPTED Sales Order
    const createOrderForQty = async (qty) => {
      const enq = await prisma.enquiry.create({
        data: {
          enquiry_number: `ENQ-CONC-${Math.random().toString(36).substring(7).toUpperCase()}`,
          customer_id: testCustomer.id,
          required_date: new Date(),
          status: 'WON',
          created_by: testCustomer.id,
        },
      });

      const quo = await prisma.quotation.create({
        data: {
          quotation_number: `QUO-CONC-${Math.random().toString(36).substring(7).toUpperCase()}`,
          enquiry_id: enq.id,
          customer_id: testCustomer.id,
          valid_until: new Date(Date.now() + 86400000),
          status: 'ACCEPTED',
          subtotal: qty * 200,
          total_discount: 0,
          taxable_amount: qty * 200,
          total_gst: qty * 36,
          grand_total: qty * 236,
          created_by: testCustomer.id,
          items: {
            create: [
              {
                product_id: concProduct.id,
                quantity: qty,
                unit_price: 200,
                discount_percent: 0,
                gst_percent: 18,
                line_amount: qty * 236,
              },
            ],
          },
        },
      });

      const so = await prisma.salesOrder.create({
        data: {
          order_number: `SO-CONC-${Math.random().toString(36).substring(7).toUpperCase()}`,
          customer_id: testCustomer.id,
          quotation_id: quo.id,
          total_amount: quo.grand_total,
          status: 'PENDING',
          created_by: testCustomer.id,
          items: {
            create: [
              { product_id: concProduct.id, quantity: qty, unit_price: 200 },
            ],
          },
        },
      });

      return so.id;
    };

    // User A requests 80, User B requests 50 (Total = 130 > 100 available)
    const orderIdA = await createOrderForQty(80);
    const orderIdB = await createOrderForQty(50);

    // Fire both reservation confirmation requests concurrently!
    const [resA, resB] = await Promise.all([
      request(app)
        .post(`/api/sales-orders/${orderIdA}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .post(`/api/sales-orders/${orderIdB}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    const statuses = [resA.status, resB.status];
    // Exactly ONE must succeed (200) and ONE must fail (400)
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Check database state: total reserved MUST NOT exceed 100
    const finalInv = await prisma.inventory.findUnique({
      where: { product_id: concProduct.id },
    });

    expect([50, 80]).toContain(finalInv.reserved_quantity);
    expect(finalInv.reserved_quantity).toBeLessThanOrEqual(100);
    expect(finalInv.physical_quantity - finalInv.reserved_quantity).toBeGreaterThanOrEqual(0);
  });

  // =========================================================================
  // TEST 7: Dispatch reduces both Physical and Reserved quantity atomically
  // =========================================================================
  test('Test 7: Dispatch reduces physical & reserved stock and updates status', async () => {
    // 1. Create product: Physical: 100, Reserved: 0
    const dispProduct = await prisma.product.create({
      data: {
        product_code: `PRD_DISP_${Date.now()}`,
        product_name: 'Dispatch Ready Coupling',
        category: 'Mechanical',
        unit: 'PCS',
        base_price: 500,
        inventory: {
          create: { physical_quantity: 100, reserved_quantity: 0 },
        },
      },
    });

    // Create quotation & order for 40 units
    const enq = await prisma.enquiry.create({
      data: {
        enquiry_number: `ENQ-DISP-${Date.now()}`,
        customer_id: testCustomer.id,
        required_date: new Date(),
        created_by: testCustomer.id,
      },
    });

    const quo = await prisma.quotation.create({
      data: {
        quotation_number: `QUO-DISP-${Date.now()}`,
        enquiry_id: enq.id,
        customer_id: testCustomer.id,
        valid_until: new Date(),
        status: 'ACCEPTED',
        subtotal: 20000,
        total_discount: 0,
        taxable_amount: 20000,
        total_gst: 3600,
        grand_total: 23600,
        created_by: testCustomer.id,
        items: {
          create: [
            {
              product_id: dispProduct.id,
              quantity: 40,
              unit_price: 500,
              discount_percent: 0,
              gst_percent: 18,
              line_amount: 23600,
            },
          ],
        },
      },
    });

    const so = await prisma.salesOrder.create({
      data: {
        order_number: `SO-DISP-${Date.now()}`,
        customer_id: testCustomer.id,
        quotation_id: quo.id,
        total_amount: 23600,
        status: 'PENDING',
        created_by: testCustomer.id,
        items: {
          create: [{ product_id: dispProduct.id, quantity: 40, unit_price: 500 }],
        },
      },
    });

    // 2. Confirm order (Physical: 100, Reserved: 40, Available: 60)
    const confRes = await request(app)
      .post(`/api/sales-orders/${so.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confRes.status).toBe(200);

    const invAfterConfirm = await prisma.inventory.findUnique({
      where: { product_id: dispProduct.id },
    });
    expect(invAfterConfirm.physical_quantity).toBe(100);
    expect(invAfterConfirm.reserved_quantity).toBe(40);

    // 3. Dispatch order (Dispatches 40 units)
    // After dispatch: Physical = 100 - 40 = 60, Reserved = 40 - 40 = 0, Available = 60
    const dispRes = await request(app)
      .post(`/api/sales-orders/${so.id}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicle_number: 'MH-14-GH-4321',
        driver_name: 'Anil Deshmukh',
      });

    expect(dispRes.status).toBe(200);
    expect(dispRes.body.data.order.status).toBe('DISPATCHED');

    const invAfterDispatch = await prisma.inventory.findUnique({
      where: { product_id: dispProduct.id },
    });
    expect(invAfterDispatch.physical_quantity).toBe(60);
    expect(invAfterDispatch.reserved_quantity).toBe(0);

    // Available stays 60!
    expect(invAfterDispatch.physical_quantity - invAfterDispatch.reserved_quantity).toBe(60);

    // Attempt duplicate dispatch: must fail
    const dupDispRes = await request(app)
      .post(`/api/sales-orders/${so.id}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vehicle_number: 'MH-14-GH-4321', driver_name: 'Anil Deshmukh' });
    expect(dupDispRes.status).toBe(400);
    expect(dupDispRes.body.message).toMatch(/already been dispatched|must be 'CONFIRMED'/i);
  });
});
