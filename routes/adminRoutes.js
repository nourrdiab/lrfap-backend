/**
 * TODO: Remove this router before production deployment.
 * For dev/demo reset only.
 */

const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { resetCycle } = require('../controllers/adminController');

const router = express.Router();

/**
 * @openapi
 * /api/admin/reset-cycle/{cycleId}:
 *   post:
 *     tags: [Admin]
 *     summary: (DEV ONLY) Reset a cycle to pre-matching state
 *     description: >
 *       Rewinds applications from matched/unmatched → submitted, clears
 *       offer state, deletes all MatchRun documents for the cycle. Does
 *       not touch Program.availableSeats or Cycle.status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reset summary }
 *       400: { description: Invalid cycle ID }
 *       404: { description: Cycle not found }
 */
router.post('/reset-cycle/:cycleId', protect, authorize('lgc'), resetCycle);

module.exports = router;
