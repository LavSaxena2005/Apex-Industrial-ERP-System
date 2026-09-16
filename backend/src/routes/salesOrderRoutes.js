const express = require('express');
const router = express.Router();
const {
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
} = require('../controllers/salesOrderController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticate);

router.get('/', getSalesOrders);
router.get('/:id', getSalesOrderById);
router.post('/:id/confirm', authorizeRoles('ADMIN'), confirmSalesOrder);
router.post('/:id/dispatch', authorizeRoles('ADMIN'), dispatchSalesOrder);
router.post('/:id/cancel', authorizeRoles('ADMIN'), cancelSalesOrder);

module.exports = router;
