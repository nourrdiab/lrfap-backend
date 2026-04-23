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
const Program = require('../models/Program');

/**
 * POST /api/admin/reset-cycle/:cycleId
 *
 * Full "pre-matching" rewind for a cycle:
 *   1. Applications in matched/unmatched → submitted; matchedProgram →
 *      null; offerStatus → none; offerExpiresAt unset. Drafts,
 *      under_review, submitted, and withdrawn are left alone.
 *   2. All MatchRun documents for the cycle are deleted (dry + official).
 *   3. Program.availableSeats is reset to the Program's capacity for
 *      every program in the cycle (executeMatch mutates this).
 *   4. If Cycle.status is matching or published, it drops back to
 *      'ranking' so matching can be re-run. Other statuses are left
 *      alone (ranking / review / open / draft / closed).
 */
exports.resetCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cycleId)) {
      return res.status(400).json({ error: 'Invalid cycle ID' });
    }

    const cycle = await Cycle.findById(cycleId);
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

    // Aggregation-pipeline update so we can reference the document's own
    // `capacity` field when rewriting `availableSeats`. Mongoose passes
    // pipeline-array updates straight through to MongoDB.
    const programResult = await Program.updateMany({ cycle: cycleId }, [
      { $set: { availableSeats: '$capacity' } },
    ]);

    let cycleStatusReset = false;
    if (cycle.status === 'matching' || cycle.status === 'published') {
      cycle.status = 'ranking';
      await cycle.save();
      cycleStatusReset = true;
    }

    return res.status(200).json({
      applicationsReset: applicationResult.modifiedCount ?? 0,
      matchRunsDeleted: matchRunResult.deletedCount ?? 0,
      programsReset: programResult.modifiedCount ?? 0,
      cycleStatusReset,
      message: 'Cycle reset to pre-matching state',
    });
  } catch (error) {
    console.error('Reset cycle error:', error);
    return res.status(500).json({ error: error.message });
  }
};
