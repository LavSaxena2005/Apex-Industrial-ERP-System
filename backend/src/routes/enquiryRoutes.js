const express = require('express');
const router = express.Router();
const {
  getEnquiries,
  getEnquiryById,
  createEnquiry,
} = require('../controllers/enquiryController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticate);

router.get('/', getEnquiries);
router.get('/:id', getEnquiryById);
router.post('/', authorizeRoles('ADMIN', 'SALES_USER'), createEnquiry);

module.exports = router;
