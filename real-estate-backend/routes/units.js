const express = require('express');
const { updateUnitStatus } = require('../controllers/unitController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.patch('/:unitId/status', authenticateToken, updateUnitStatus);

module.exports = router;