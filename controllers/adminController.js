/**
 * TODO: Remove this controller before production deployment.
 * For dev/demo reset only.
 *
 * Houses admin-only utilities that mutate state in ways production
 * users should never be able to trigger. Authorization is enforced at
 * the route layer (authorize('lgc')).
 */

const mongoose = require('mongoose');
const Application = require('../models/Application');
const Cycle = require('../models/Cycle');
const MatchRun = require('../models/MatchRun');

/**
 * POST /api/admin/reset-cycle/:cycleId
 *
 * Rewinds a cycle's applications from matched/unmatched back to
 * submitted, clears offer state, and deletes all MatchRun documents for
 * the cycle. Drafts, under_review, submitted (already), and withdrawn
 * applications are intentionally left alone.
 *
 * Does NOT touch Program.availableSeats (mutated by executeMatch) or
 * Cycle.status — use the Cycles Management page to advance the cycle
 * manually after reset.
 */
exports.resetCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cycleId)) {
      return res.status(400).json({ error: 'Invalid cycle ID' });
    }

    const cycle = await Cycle.findById(cycleId).select('_id');
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    const applicationResult = await Application.updateMany(
      { cycle: cycleId, status: { $in: ['matched', 'unmatched'] } },
      {
        $set: {
          status: 'submitted',
          matchedProgram: null,
          offerStatus: 'none',
        },
        $unset: { offerExpiresAt: '' },
      }
    );

    const matchRunResult = await MatchRun.deleteMany({ cycle: cycleId });

    return res.status(200).json({
      applicationsReset: applicationResult.modifiedCount ?? 0,
      matchRunsDeleted: matchRunResult.deletedCount ?? 0,
      message: 'Cycle reset to pre-matching state',
    });
  } catch (error) {
    console.error('Reset cycle error:', error);
    return res.status(500).json({ error: error.message });
  }
};
