const InventoryService = require('../services/inventoryService');

const getInventory = async (req, res, next) => {
  try {
    const data = await InventoryService.getInventoryOverview();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updatePhysicalStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { physical_quantity } = req.body;

    if (physical_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'physical_quantity is required.',
      });
    }

    const updated = await InventoryService.updatePhysicalStock(productId, physical_quantity);
    return res.status(200).json({
      success: true,
      message: 'Physical stock updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, updatePhysicalStock };
