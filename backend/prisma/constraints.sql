DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_physical_non_negative') THEN
    ALTER TABLE inventory ADD CONSTRAINT chk_inventory_physical_non_negative CHECK (physical_quantity >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_reserved_non_negative') THEN
    ALTER TABLE inventory ADD CONSTRAINT chk_inventory_reserved_non_negative CHECK (reserved_quantity >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_enquiry_item_qty') THEN
    ALTER TABLE enquiry_items ADD CONSTRAINT chk_enquiry_item_qty CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_quotation_item_qty') THEN
    ALTER TABLE quotation_items ADD CONSTRAINT chk_quotation_item_qty CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_so_item_qty') THEN
    ALTER TABLE sales_order_items ADD CONSTRAINT chk_so_item_qty CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dispatch_item_qty') THEN
    ALTER TABLE dispatch_items ADD CONSTRAINT chk_dispatch_item_qty CHECK (quantity > 0);
  END IF;
END $$;
