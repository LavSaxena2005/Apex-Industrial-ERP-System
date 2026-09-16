const express = require('express');
const router = express.Router();
const { getInventory, updatePhysicalStock } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticate);

router.get('/', getInventory);
router.patch('/:productId', authorizeRoles('ADMIN'), updatePhysicalStock);

module.exports = router;
