const prisma = require('../config/database');

/**
 * End-to-end audit traceability across the full ERP lifecycle:
 * Customer → Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch
 */
const getTraceability = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entityId = parseInt(id, 10);

    let customer = null;
    let enquiry = null;
    let quotation = null;
    let salesOrder = null;
    let dispatches = [];

    if (type === 'enquiry') {
      enquiry = await prisma.enquiry.findUnique({
        where: { id: entityId },
        include: {
          customer: true,
          items: { include: { product: true } },
          quotations: {
            include: {
              items: { include: { product: true } },
              sales_order: {
                include: {
                  items: { include: { product: true } },
                  dispatches: {
                    include: { items: { include: { product: true } } },
                  },
                },
              },
            },
          },
        },
      });

      if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      customer = enquiry.customer;
      quotation = enquiry.quotations[0] || null;
      salesOrder = quotation?.sales_order || null;
      dispatches = salesOrder?.dispatches || [];
    } else if (type === 'quotation') {
      quotation = await prisma.quotation.findUnique({
        where: { id: entityId },
        include: {
          customer: true,
          enquiry: {
            include: { items: { include: { product: true } } },
          },
          items: { include: { product: true } },
          sales_order: {
            include: {
              items: { include: { product: true } },
              dispatches: {
                include: { items: { include: { product: true } } },
              },
            },
          },
        },
      });

      if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found.' });
      customer = quotation.customer;
      enquiry = quotation.enquiry;
      salesOrder = quotation.sales_order;
      dispatches = salesOrder?.dispatches || [];
    } else if (type === 'sales_order') {
      salesOrder = await prisma.salesOrder.findUnique({
        where: { id: entityId },
        include: {
          customer: true,
          items: { include: { product: true } },
          quotation: {
            include: {
              enquiry: {
                include: { items: { include: { product: true } } },
              },
              items: { include: { product: true } },
            },
          },
          dispatches: {
            include: { items: { include: { product: true } } },
          },
        },
      });

      if (!salesOrder) return res.status(404).json({ success: false, message: 'Sales Order not found.' });
      customer = salesOrder.customer;
      quotation = salesOrder.quotation;
      enquiry = quotation?.enquiry || null;
      dispatches = salesOrder.dispatches || [];
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid traceability entity type. Must be 'enquiry', 'quotation', or 'sales_order'.",
      });
    }

    // Build timeline steps
    const steps = [
      {
        step: 1,
        title: 'Customer',
        completed: !!customer,
        data: customer
          ? {
              id: customer.id,
              name: customer.company_name,
              contact: customer.contact_person,
              city: customer.city,
            }
          : null,
      },
      {
        step: 2,
        title: 'Enquiry',
        completed: !!enquiry,
        data: enquiry
          ? {
              id: enquiry.id,
              number: enquiry.enquiry_number,
              date: enquiry.enquiry_date,
              status: enquiry.status,
              itemsCount: enquiry.items?.length || 0,
            }
          : null,
      },
      {
        step: 3,
        title: 'Quotation',
        completed: !!quotation,
        data: quotation
          ? {
              id: quotation.id,
              number: quotation.quotation_number,
              status: quotation.status,
              grandTotal: quotation.grand_total,
              validUntil: quotation.valid_until,
            }
          : null,
      },
      {
        step: 4,
        title: 'Sales Order',
        completed: !!salesOrder,
        data: salesOrder
          ? {
              id: salesOrder.id,
              number: salesOrder.order_number,
              status: salesOrder.status,
              totalAmount: salesOrder.total_amount,
              orderDate: salesOrder.order_date,
            }
          : null,
      },
      {
        step: 5,
        title: 'Stock Reservation',
        completed: salesOrder?.status === 'CONFIRMED' || salesOrder?.status === 'DISPATCHED',
        data: salesOrder
          ? {
              status:
                salesOrder.status === 'CONFIRMED' || salesOrder.status === 'DISPATCHED'
                  ? 'RESERVED'
                  : salesOrder.status === 'CANCELLED'
                  ? 'CANCELLED'
                  : 'PENDING',
              items: salesOrder.items?.map((it) => ({
                product: it.product?.product_name,
                code: it.product?.product_code,
                reservedQty: it.quantity,
              })),
            }
          : null,
      },
      {
        step: 6,
        title: 'Dispatch',
        completed: dispatches.length > 0,
        data:
          dispatches.length > 0
            ? dispatches.map((d) => ({
                id: d.id,
                dispatchNumber: d.dispatch_number,
                dispatchDate: d.dispatch_date,
                vehicleNumber: d.vehicle_number,
                driverName: d.driver_name,
              }))
            : null,
      },
    ];

    return res.status(200).json({
      success: true,
      data: {
        customer,
        enquiry,
        quotation,
        salesOrder,
        dispatches,
        steps,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTraceability };
