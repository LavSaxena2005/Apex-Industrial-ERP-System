const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  convertToSalesOrder,
} = require('../controllers/quotationController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticate);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', authorizeRoles('ADMIN', 'SALES_USER'), createQuotation);
router.patch('/:id/status', authorizeRoles('ADMIN', 'SALES_USER'), updateQuotationStatus);
router.post('/:id/convert', authorizeRoles('ADMIN', 'SALES_USER'), convertToSalesOrder);

module.exports = router;
