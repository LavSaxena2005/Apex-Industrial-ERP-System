const express = require('express');
const router = express.Router();
const { getProducts, createProduct } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticate);

router.get('/', getProducts);
router.post('/', authorizeRoles('ADMIN'), createProduct);

module.exports = router;
