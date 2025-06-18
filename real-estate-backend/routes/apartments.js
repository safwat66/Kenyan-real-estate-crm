const express = require('express');
const { getApartments, createApartment, getDashboardStats } = require('../controllers/apartmentController');
const { getUnits, createUnit, updateUnitStatus } = require('../controllers/unitController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Apartment routes
router.get('/', authenticateToken, getApartments);
router.post('/', authenticateToken, upload.single('image'), createApartment);
router.get('/:apartmentId/stats', authenticateToken, getDashboardStats);

// Unit routes
router.get('/:apartmentId/units', authenticateToken, getUnits);
router.post('/:apartmentId/units', authenticateToken, createUnit);

module.exports = router;