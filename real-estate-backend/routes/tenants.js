const express = require('express');
const { getTenants, createTenant } = require('../controllers/tenantController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getTenants);
router.post('/', authenticateToken, createTenant);

module.exports = router;