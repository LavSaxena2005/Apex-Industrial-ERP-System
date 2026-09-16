/**
 * Quotation Service
 * Enforces backend calculation integrity for pricing, discounts, and GST.
 */
class QuotationService {
  /**
   * Calculate line items and totals authoritatively on backend.
   *
   * Formula per item:
   * Base Amount = Quantity × Unit Price
   * Discount Amount = Base Amount × (Discount% / 100)
   * Taxable Amount = Base Amount - Discount Amount
   * GST Amount = Taxable Amount × (GST% / 100)
   * Line Amount = Taxable Amount + GST Amount
   */
  static calculateQuotation(items) {
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Quotation must contain at least one item.');
      error.statusCode = 400;
      throw error;
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let grandTotal = 0;

    const computedItems = items.map((item) => {
      const quantity = parseInt(item.quantity, 10);
      const unitPrice = parseFloat(item.unit_price);
      const discountPercent = item.discount_percent !== undefined ? parseFloat(item.discount_percent) : 0.0;
      const gstPercent = item.gst_percent !== undefined ? parseFloat(item.gst_percent) : 18.0;

      if (isNaN(quantity) || quantity <= 0) {
        const error = new Error(`Invalid item quantity: must be greater than 0.`);
        error.statusCode = 400;
        throw error;
      }

      if (isNaN(unitPrice) || unitPrice < 0) {
        const error = new Error(`Invalid unit price: must be a non-negative number.`);
        error.statusCode = 400;
        throw error;
      }

      if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        const error = new Error(`Discount percent must be between 0 and 100.`);
        error.statusCode = 400;
        throw error;
      }

      if (isNaN(gstPercent) || gstPercent < 0) {
        const error = new Error(`GST percent must be a non-negative number.`);
        error.statusCode = 400;
        throw error;
      }

      // Calculations with 2 decimal places precision
      const baseAmount = +(quantity * unitPrice).toFixed(2);
      const discountAmount = +(baseAmount * (discountPercent / 100)).toFixed(2);
      const taxableAmount = +(baseAmount - discountAmount).toFixed(2);
      const gstAmount = +(taxableAmount * (gstPercent / 100)).toFixed(2);
      const lineAmount = +(taxableAmount + gstAmount).toFixed(2);

      subtotal += baseAmount;
      totalDiscount += discountAmount;
      totalTaxable += taxableAmount;
      totalGst += gstAmount;
      grandTotal += lineAmount;

      return {
        product_id: parseInt(item.product_id, 10),
        quantity,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        gst_percent: gstPercent,
        base_amount: baseAmount,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_amount: gstAmount,
        line_amount: lineAmount,
      };
    });

    return {
      items: computedItems,
      subtotal: +subtotal.toFixed(2),
      total_discount: +totalDiscount.toFixed(2),
      taxable_amount: +totalTaxable.toFixed(2),
      total_gst: +totalGst.toFixed(2),
      grand_total: +grandTotal.toFixed(2),
    };
  }
}

module.exports = QuotationService;
