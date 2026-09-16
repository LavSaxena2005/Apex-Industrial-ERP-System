const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer } = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticate);

router.get('/', getCustomers);
router.post('/', authorizeRoles('ADMIN', 'SALES_USER'), createCustomer);

module.exports = router;
