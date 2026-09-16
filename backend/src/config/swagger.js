const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Industrial Sales & Inventory ERP API',
    version: '1.0.0',
    description:
      'Production-grade REST API managing complete industrial sales lifecycle: Customer → Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch.',
    contact: {
      name: 'ERP Engineering Team',
      email: 'engineer@apex-erp.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token received from /auth/login',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate user & receive JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@apex.com' },
                  password: { type: 'string', example: 'Admin@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with token and role' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        responses: {
          200: { description: 'Current authenticated user profile' },
        },
      },
    },
    '/customers': {
      get: {
        summary: 'List all customers',
        responses: { 200: { description: 'Array of customer records' } },
      },
      post: {
        summary: 'Create a new business customer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['company_name', 'contact_person', 'mobile', 'email', 'city'],
                properties: {
                  company_name: { type: 'string', example: 'Apex Precision Gears' },
                  contact_person: { type: 'string', example: 'Sunil Rao' },
                  mobile: { type: 'string', example: '+91 99887 76655' },
                  email: { type: 'string', example: 'sunil@apexgears.com' },
                  city: { type: 'string', example: 'Pune' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Customer created' } },
      },
    },
    '/products': {
      get: {
        summary: 'List products with current stock indicators',
        responses: { 200: { description: 'Array of products' } },
      },
      post: {
        summary: 'Create product (ADMIN only)',
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/inventory': {
      get: {
        summary: 'List inventory with computed available stock (physical - reserved)',
        responses: { 200: { description: 'Inventory stock list' } },
      },
    },
    '/inventory/{productId}': {
      patch: {
        summary: 'Manually adjust physical stock (ADMIN only)',
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['physical_quantity'],
                properties: { physical_quantity: { type: 'integer', example: 250 } },
              },
            },
          },
        },
        responses: { 200: { description: 'Stock adjusted' } },
      },
    },
    '/enquiries': {
      get: {
        summary: 'List all customer enquiries',
        responses: { 200: { description: 'Array of enquiries' } },
      },
      post: {
        summary: 'Create a customer enquiry with multiple product items',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer_id', 'required_date', 'items'],
                properties: {
                  customer_id: { type: 'integer', example: 1 },
                  required_date: { type: 'string', format: 'date', example: '2026-10-15' },
                  notes: { type: 'string', example: 'High priority urgent plant overhaul requirement.' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['product_id', 'quantity'],
                      properties: {
                        product_id: { type: 'integer', example: 1 },
                        quantity: { type: 'integer', example: 25 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Enquiry created' } },
      },
    },
    '/quotations': {
      get: {
        summary: 'List all quotations',
        responses: { 200: { description: 'Array of quotations' } },
      },
      post: {
        summary: 'Create quotation with backend calculated pricing & GST',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['enquiry_id', 'valid_until', 'items'],
                properties: {
                  enquiry_id: { type: 'integer', example: 1 },
                  valid_until: { type: 'string', format: 'date', example: '2026-10-30' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['product_id', 'quantity', 'unit_price'],
                      properties: {
                        product_id: { type: 'integer', example: 1 },
                        quantity: { type: 'integer', example: 10 },
                        unit_price: { type: 'number', example: 1000 },
                        discount_percent: { type: 'number', example: 10 },
                        gst_percent: { type: 'number', example: 18 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Quotation created with authoritative backend calculations' } },
      },
    },
    '/quotations/{id}/status': {
      patch: {
        summary: 'Update quotation status (SENT, ACCEPTED, REJECTED)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['SENT', 'ACCEPTED', 'REJECTED'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/quotations/{id}/convert': {
      post: {
        summary: 'Convert ACCEPTED quotation to Sales Order (prevents duplicates via DB constraint)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          201: { description: 'Sales order created' },
          400: { description: 'Quotation not in ACCEPTED status' },
          409: { description: 'Quotation already converted to Sales Order' },
        },
      },
    },
    '/sales-orders': {
      get: {
        summary: 'List all sales orders',
        responses: { 200: { description: 'Array of sales orders' } },
      },
    },
    '/sales-orders/{id}/confirm': {
      post: {
        summary: 'Confirm Sales Order & Reserve Inventory using PostgreSQL Row-Level Locks (ADMIN only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Order confirmed and inventory reserved' },
          400: { description: 'Insufficient stock or invalid status' },
          403: { description: 'Forbidden: Requires ADMIN role' },
        },
      },
    },
    '/sales-orders/{id}/dispatch': {
      post: {
        summary: 'Dispatch Confirmed Sales Order (decrements physical & reserved stock) (ADMIN only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicle_number', 'driver_name'],
                properties: {
                  vehicle_number: { type: 'string', example: 'MH-12-AB-1234' },
                  driver_name: { type: 'string', example: 'Ramesh Patil' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order dispatched' },
          400: { description: 'Order not confirmed or invalid dispatch' },
          403: { description: 'Forbidden: Requires ADMIN role' },
        },
      },
    },
    '/sales-orders/{id}/cancel': {
      post: {
        summary: 'Cancel Sales Order (releases reserved stock if confirmed) (ADMIN only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Order cancelled and reserved stock released' } },
      },
    },
    '/traceability/{type}/{id}': {
      get: {
        summary: 'Get full end-to-end traceability lineage (Customer → Enquiry → Quotation → Sales Order → Reservation → Dispatch)',
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['enquiry', 'quotation', 'sales_order'] } },
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Full traceability graph' } },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/docs.json', (req, res) => res.json(swaggerDocument));
};

module.exports = setupSwagger;
