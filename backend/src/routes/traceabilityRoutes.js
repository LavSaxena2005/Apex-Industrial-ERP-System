const express = require('express');
const router = express.Router();
const { getTraceability } = require('../controllers/traceabilityController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:type/:id', getTraceability);

module.exports = router;
