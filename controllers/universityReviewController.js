const Application = require('../models/Application');
const Program = require('../models/Program');
const ProgramRanking = require('../models/ProgramRanking');
const Cycle = require('../models/Cycle');
const { logAction } = require('../utils/audit');
const { notify } = require('../utils/notify');

const ensureProgramBelongsToUser = async (programId, user) => {
  const program = await Program.findById(programId);
  if (!program) return { error: 'Program not found', status: 404 };
  if (user.role !== 'lgc' && program.university.toString() !== (user.university || '').toString()) {
    return { error: 'Forbidden: program does not belong to your institution', status: 403 };
  }
  return { program };
};

exports.getMyPrograms = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'university') {
      filter.university = req.user.university;
    }
    const programs = await Program.find(filter)
      .populate('specialty', 'name code')
      .populate('cycle', 'name year status');
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProgramApplications = async (req, res) => {
  try {
    const { programId } = req.params;
    const check = await ensureProgramBelongsToUser(programId, req.user);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const { status, search } = req.query;
    const filter = {
      'selections.program': programId,
      status: { $in: ['submitted', 'under_review', 'matched', 'unmatched'] },
    };
    if (status) filter.status = status;

    let applications = await Application.find(filter)
      .populate('applicant', 'firstName lastName email')
      .populate('cycle', 'name year')
      .populate({
        path: 'selections.program',
        select: 'track',
      });

    if (search) {
      const term = search.toLowerCase();
      applications = applications.filter((app) => {
        const name = `${app.applicant.firstName} ${app.applicant.lastName}`.toLowerCase();
        return name.includes(term) || app.applicant.email.toLowerCase().includes(term);
      });
    }

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApplicationDetail = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('applicant', 'firstName lastName email')
      .populate('cycle')
      .populate({
        path: 'selections.program',
        populate: [
          { path: 'university', select: 'name code' },
          { path: 'specialty', select: 'name code' },
        ],
      });

    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (req.user.role === 'university') {
      const belongsToUniversity = application.selections.some(
        (s) => s.program.university._id.toString() === req.user.university.toString()
      );
      if (!belongsToUniversity) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProgramRanking = async (req, res) => {
  try {
    const { programId } = req.params;
    const check = await ensureProgramBelongsToUser(programId, req.user);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const program = check.program;

    let ranking = await ProgramRanking.findOne({ program: programId, cycle: program.cycle })
      .populate('rankedApplicants.applicant', 'firstName lastName email')
      .populate('submittedBy', 'firstName lastName');

    if (!ranking) {
      ranking = await ProgramRanking.create({
        program: programId,
        cycle: program.cycle,
        rankedApplicants: [],
      });
    }

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProgramRanking = async (req, res) => {
  try {
    const { programId } = req.params;
    const check = await ensureProgramBelongsToUser(programId, req.user);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const program = check.program;
    const { rankedApplicants } = req.body;

    if (!Array.isArray(rankedApplicants)) {
      return res.status(400).json({ error: 'rankedApplicants must be an array' });
    }

    let ranking = await ProgramRanking.findOne({ program: programId, cycle: program.cycle });
    if (!ranking) {
      ranking = new ProgramRanking({ program: programId, cycle: program.cycle });
    }

    if (ranking.status === 'submitted') {
      return res.status(400).json({ error: 'Ranking has already been submitted and is locked' });
    }

    const applicationIds = rankedApplicants.map((r) => r.application);
    const validApplications = await Application.find({
      _id: { $in: applicationIds },
      'selections.program': programId,
      status: { $in: ['submitted', 'under_review'] },
    });

    if (validApplications.length !== applicationIds.length) {
      return res.status(400).json({
        error: 'One or more applications are invalid or did not select this program',
      });
    }

    ranking.rankedApplicants = rankedApplicants;
    await ranking.save();

    const populated = await ProgramRanking.findById(ranking._id)
      .populate('rankedApplicants.applicant', 'firstName lastName email');

    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.submitProgramRanking = async (req, res) => {
  try {
    const { programId } = req.params;
    const check = await ensureProgramBelongsToUser(programId, req.user);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const program = check.program;
    const cycle = await Cycle.findById(program.cycle);
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
    if (new Date() > cycle.rankingDeadline) {
      return res.status(400).json({ error: 'Ranking deadline has passed' });
    }

    const ranking = await ProgramRanking.findOne({ program: programId, cycle: program.cycle });
    if (!ranking) return res.status(404).json({ error: 'Ranking not found' });
    if (ranking.status === 'submitted') {
      return res.status(400).json({ error: 'Ranking is already submitted' });
    }
    if (!ranking.rankedApplicants || ranking.rankedApplicants.length === 0) {
      return res.status(400).json({ error: 'Cannot submit an empty ranking' });
    }

    ranking.status = 'submitted';
    ranking.submittedAt = new Date();
    ranking.submittedBy = req.user._id;
    await ranking.save();

    await logAction({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'PROGRAM_RANKING_SUBMITTED',
      targetType: 'ProgramRanking',
      targetId: ranking._id,
      metadata: { programId, cycleId: program.cycle },
      ipAddress: req.ip,
    });

    await notify({
      user: req.user._id,
      type: 'ranking_submitted',
      title: 'Ranking submitted',
      message: 'Your program ranking has been submitted and locked.',
      link: `/university/programs/${programId}/ranking`,
      metadata: { programId, rankingId: ranking._id },
    });

    res.json({ message: 'Ranking submitted successfully', ranking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};