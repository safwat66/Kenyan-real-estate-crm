const express = require('express');
const authRoutes = require('./auth');
const apartmentRoutes = require('./apartments');
const unitRoutes = require('./units');
const tenantRoutes = require('./tenants');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/apartments', apartmentRoutes);
router.use('/units', unitRoutes);
router.use('/tenants', tenantRoutes);

module.exports = router;