# Industrial Sales & Inventory ERP System

A production-grade full-stack ERP application implementing the complete industrial sales lifecycle:

**Customer → Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js 24 + Express.js 4 |
| Database | PostgreSQL 18 |
| ORM | Prisma 5 |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| API Docs | Swagger UI |
| Tests | Jest + Supertest |

---

## Quick Start

### Prerequisites

- Node.js v18+ installed
- PostgreSQL 18 running on port 5432
- Database `erp_db` created

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# backend/.env (already configured)
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_db?schema=public"
JWT_SECRET="super_secret_jwt_key_industrial_erp_2026"
JWT_EXPIRES_IN="24h"
NODE_ENV="development"
```

### 3. Initialize Database Schema and Seed Data

```bash
cd backend
npx prisma db push
node prisma/seed.js
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
# → http://localhost:5000
# → API Docs: http://localhost:5000/api/docs
```

### 5. Start Frontend (separate terminal)

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

---

## Demo Credentials

| Role | Email | Password | Capabilities |
|---|---|---|---|
| **ADMIN** | `admin@apex.com` | `Admin@123` | All operations including Confirm, Dispatch, Cancel, Inventory Adjust |
| **Sales User** | `sales@apex.com` | `Sales@123` | Create customers, enquiries, quotations; Convert to Sales Order; View inventory |

> **Tip**: Use the "Switch to Admin / Switch to Sales User" button at the bottom of the left sidebar for instant role-toggling without re-login.

---

## Automated Test Suite

```bash
cd backend
npm test
```

### Tests Included

| Test | Description |
|---|---|
| **Test 1** | Quotation total calculated authoritatively on backend (ignores any client-submitted totals) |
| **Test 2** | DRAFT/REJECTED/SENT quotation cannot be converted to Sales Order — returns HTTP 400 |
| **Test 3** | Same quotation cannot create duplicate Sales Orders — DB unique constraint + app-layer check |
| **Test 4** | Inventory reservation fails when available stock < required quantity — stock untouched |
| **Test 5** | SALES_USER cannot call Confirm/Dispatch/Inventory-Update APIs — HTTP 403 Forbidden |
| **Test 6 (Bonus)** | Concurrent simultaneous reservations (80 + 50 on 100 stock) — exactly one succeeds, one fails |
| **Test 7** | Dispatch decrements both physical_quantity and reserved_quantity atomically |

---

## REST API Reference

Base URL: `http://localhost:5000/api`

Interactive Swagger Documentation: `http://localhost:5000/api/docs`

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, get JWT |
| GET | `/auth/me` | Any | Get current profile |

### Customers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/customers` | Any | List all customers |
| POST | `/customers` | Any | Create customer |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | Any | List products with stock indicators |
| POST | `/products` | ADMIN | Create product |

### Inventory
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/inventory` | Any | List stock (physical - reserved = available) |
| PATCH | `/inventory/:productId` | ADMIN | Adjust physical stock |

### Enquiries
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/enquiries` | Any | List all enquiries |
| GET | `/enquiries/:id` | Any | Get enquiry details |
| POST | `/enquiries` | Any | Create enquiry with multi-product items |

### Quotations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/quotations` | Any | List all quotations |
| GET | `/quotations/:id` | Any | Get quotation with itemized breakdown |
| POST | `/quotations` | Any | Create quotation (backend computes pricing) |
| PATCH | `/quotations/:id/status` | Any | Update status (SENT/ACCEPTED/REJECTED) |
| POST | `/quotations/:id/convert` | Any | Convert ACCEPTED quotation to Sales Order |

### Sales Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sales-orders` | Any | List all orders |
| GET | `/sales-orders/:id` | Any | Get order with dispatch history |
| POST | `/sales-orders/:id/confirm` | **ADMIN** | Reserve stock (SELECT ... FOR UPDATE row lock) |
| POST | `/sales-orders/:id/dispatch` | **ADMIN** | Dispatch order (decrement physical + reserved) |
| POST | `/sales-orders/:id/cancel` | **ADMIN** | Cancel order (release reserved stock) |

### Traceability
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/traceability/:type/:id` | Any | Full lineage: enquiry, quotation, or sales_order |

---

## Database Schema

### Key Design Decisions

#### 1. `available_quantity` is Never Stored
```
available_quantity = physical_quantity - reserved_quantity
```
This prevents inconsistency. The value is computed on every read.

#### 2. `sales_orders.quotation_id` UNIQUE Constraint
Prevents duplicate sales orders from the same quotation at both application and database level.

#### 3. PostgreSQL Row-Level Locking (SELECT ... FOR UPDATE)
```sql
BEGIN;
  SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE;
  -- verify available >= required
  UPDATE inventory SET reserved_quantity = reserved_quantity + $2 WHERE product_id = $1;
  UPDATE sales_orders SET status = 'CONFIRMED' WHERE id = $3;
COMMIT;
```
Ensures concurrent reservation requests are handled safely without race conditions.

### ER Overview
```
users ─────────────────────────────────┐
customers ───────────────────────────┐ │
products ──────────────────────────┐ │ │
                                   │ │ │
enquiries ──────────── enquiry_items │ │
│                                   │ │
└──► quotations ─── quotation_items  │ │
     │                               │ │
     └──► sales_orders ─── sales_order_items
          │                          │
          └──► dispatches ─── dispatch_items
                                     │
inventory ─────────────────────────┘
```

---

## Project Structure

```
project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Full relational schema
│   │   ├── seed.js              # 6 products, 4 customers, 2 users, full workflow demo
│   │   └── constraints.sql      # CHECK constraints for non-negative quantities
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # Prisma client instance
│   │   │   └── swagger.js       # OpenAPI 3.0 documentation
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── customerController.js
│   │   │   ├── productController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── enquiryController.js
│   │   │   ├── quotationController.js
│   │   │   ├── salesOrderController.js
│   │   │   └── traceabilityController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification
│   │   │   ├── role.js          # RBAC enforcement
│   │   │   └── errorHandler.js  # Global error handler with Prisma codes
│   │   ├── routes/              # Express routers (7 route files)
│   │   ├── services/
│   │   │   ├── quotationService.js   # Authoritative backend price calculation
│   │   │   ├── salesOrderService.js  # Quotation-to-order conversion (duplicate prevention)
│   │   │   └── inventoryService.js   # Row-locked stock reservation & dispatch
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # HTTP server entry point
│   └── tests/
│       └── erp.test.js          # 7 comprehensive automated tests
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # JWT auth state + one-click demo switcher
    │   ├── components/
    │   │   ├── Navbar.jsx       # Navigation + role switcher
    │   │   ├── Modal.jsx        # Reusable modal with Escape listener
    │   │   ├── StatusBadge.jsx  # Glowing colored status pills
    │   │   └── TraceabilityBanner.jsx  # 6-stage pipeline stepper
    │   ├── pages/
    │   │   ├── Login.jsx        # Auth with one-click demo buttons
    │   │   ├── Enquiries.jsx    # Multi-product enquiry creation + customer modal
    │   │   ├── Quotations.jsx   # Itemized pricing, GST, status flow, conversion
    │   │   ├── SalesOrders.jsx  # Confirmation, reservation, dispatch execution
    │   │   └── Inventory.jsx    # Real-time stock dashboard with KPI metrics
    │   ├── services/
    │   │   └── api.js           # Typed API client with Bearer token injection
    │   ├── App.jsx              # SPA router + auth guard
    │   ├── main.jsx
    │   └── index.css            # Full design system (dark theme, glassmorphism)
    └── vite.config.js           # Vite with API proxy

```

---

## Core Business Flows

### Quotation Pricing (Backend Authoritative)
```
Base Amount      = Quantity × Unit Price
Discount Amount  = Base Amount × (Discount% / 100)
Taxable Amount   = Base Amount - Discount Amount
GST Amount       = Taxable Amount × (GST% / 100)
Line Amount      = Taxable Amount + GST Amount
Grand Total      = Σ(Line Amounts)
```

### Stock Lifecycle
```
After Sales Order Confirmation (PENDING → CONFIRMED):
  physical_quantity: unchanged
  reserved_quantity: += ordered_quantity
  available_quantity: physical - reserved (decreases)

After Dispatch (CONFIRMED → DISPATCHED):
  physical_quantity: -= dispatched_quantity
  reserved_quantity: -= dispatched_quantity
  available_quantity: remains same (physical - reserved)
```

---

## Seeded Sample Data

| Item | Details |
|---|---|
| **Users** | admin@apex.com (ADMIN), sales@apex.com (SALES_USER) |
| **Customers** | ABC Engineering, Precision Dynamics, Kirloskar Heavy Industries, Apex Turbo Systems |
| **Products** | 6 industrial products (Bearings, Couplings, Hydraulic Valves, Pneumatic Cylinders, Flange Adapters, Gearboxes) |
| **Demo Workflow** | ENQ-0001 → QUO-0001 → SO-0001 → DIS-0001 (complete end-to-end) |
| **Open Enquiry** | ENQ-0002 ready for live quotation creation demo |
