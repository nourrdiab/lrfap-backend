const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getLGCDashboard, getApplicantDashboard } = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @openapi
 * /api/dashboard/lgc:
 *   get:
 *     tags: [Dashboards]
 *     summary: LGC committee dashboard with system-wide metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Counts, capacity, applications by specialty, recent activity }
 */
router.get('/lgc', protect, authorize('lgc'), getLGCDashboard);

/**
 * @openapi
 * /api/dashboard/applicant:
 *   get:
 *     tags: [Dashboards]
 *     summary: Authenticated applicant's personal dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Profile completion, checklist, applications, active cycle }
 */
router.get('/applicant', protect, authorize('applicant'), getApplicantDashboard);

module.exports = router;