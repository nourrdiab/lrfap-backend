const User = require('../models/User');
const Application = require('../models/Application');
const Program = require('../models/Program');
const University = require('../models/University');
const Specialty = require('../models/Specialty');
const Cycle = require('../models/Cycle');
const ApplicantProfile = require('../models/ApplicantProfile');
const AuditLog = require('../models/AuditLog');
const ProgramRanking = require('../models/ProgramRanking');

exports.getLGCDashboard = async (req, res) => {
  try {
    const [
      totalApplicants,
      totalUniversities,
      totalSpecialties,
      totalPrograms,
      totalApplications,
      submittedApplications,
      matchedApplications,
      unmatchedApplications,
      submittedRankings,
      activeCycle,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: 'applicant', isActive: true }),
      University.countDocuments({ isActive: true }),
      Specialty.countDocuments({ isActive: true }),
      Program.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'submitted' }),
      Application.countDocuments({ status: 'matched' }),
      Application.countDocuments({ status: 'unmatched' }),
      ProgramRanking.countDocuments({ status: 'submitted' }),
      Cycle.findOne({ status: { $in: ['open', 'review', 'ranking', 'matching', 'published'] } }).sort('-year'),
      AuditLog.find().populate('actor', 'firstName lastName email role').sort('-createdAt').limit(10),
    ]);

    const programs = await Program.find({ isActive: true });
    const totalCapacity = programs.reduce((sum, p) => sum + p.capacity, 0);
    const totalAvailableSeats = programs.reduce((sum, p) => sum + p.availableSeats, 0);
    const filledSeats = totalCapacity - totalAvailableSeats;
    const fillRate = totalCapacity > 0 ? Math.round((filledSeats / totalCapacity) * 100) : 0;

    const applicationsBySpecialty = await Application.aggregate([
      { $match: { status: { $in: ['submitted', 'matched', 'unmatched'] } } },
      { $unwind: '$selections' },
      { $group: { _id: '$selections.program', count: { $sum: 1 } } },
      { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'program' } },
      { $unwind: '$program' },
      { $group: { _id: '$program.specialty', count: { $sum: '$count' } } },
      { $lookup: { from: 'specialties', localField: '_id', foreignField: '_id', as: 'specialty' } },
      { $unwind: '$specialty' },
      { $project: { specialty: '$specialty.name', code: '$specialty.code', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      counts: {
        applicants: totalApplicants,
        universities: totalUniversities,
        specialties: totalSpecialties,
        programs: totalPrograms,
        applications: {
          total: totalApplications,
          submitted: submittedApplications,
          matched: matchedApplications,
          unmatched: unmatchedApplications,
        },
        rankingsSubmitted: submittedRankings,
      },
      capacity: {
        totalCapacity,
        filledSeats,
        availableSeats: totalAvailableSeats,
        fillRate,
      },
      activeCycle: activeCycle
        ? {
            id: activeCycle._id,
            name: activeCycle.name,
            year: activeCycle.year,
            status: activeCycle.status,
            submissionDeadline: activeCycle.submissionDeadline,
            rankingDeadline: activeCycle.rankingDeadline,
            resultPublicationDate: activeCycle.resultPublicationDate,
          }
        : null,
      applicationsBySpecialty,
      recentActivity: recentActivity.map((log) => ({
        id: log._id,
        action: log.action,
        actor: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'Unknown',
        actorRole: log.actorRole,
        targetType: log.targetType,
        outcome: log.outcome,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('LGC dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getApplicantDashboard = async (req, res) => {
  try {
    const [profile, applications, activeCycle] = await Promise.all([
      ApplicantProfile.findOne({ user: req.user._id }),
      Application.find({ applicant: req.user._id })
        .populate('cycle', 'name year status submissionDeadline rankingDeadline resultPublicationDate')
        .populate('matchedProgram'),
      Cycle.findOne({ status: { $in: ['open', 'review', 'ranking', 'matching', 'published'] } }).sort('-year'),
    ]);

    const profileFields = ['dateOfBirth', 'gender', 'nationality', 'phone', 'medicalSchool', 'graduationYear'];
    let completedFields = 0;
    if (profile) {
      for (const f of profileFields) {
        if (profile[f] !== undefined && profile[f] !== null && profile[f] !== '') completedFields++;
      }
    }
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    const checklist = {
      profileCompleted: profile?.profileCompleted || false,
      hasDraft: applications.some((a) => a.status === 'draft'),
      hasSubmitted: applications.some((a) => a.status === 'submitted' || a.status === 'matched' || a.status === 'unmatched'),
      hasMatch: applications.some((a) => a.status === 'matched'),
      hasPendingOffer: applications.some((a) => a.offerStatus === 'pending'),
    };

    res.json({
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
      },
      profileCompletion,
      checklist,
      applications: applications.map((a) => ({
        id: a._id,
        cycle: a.cycle,
        track: a.track,
        status: a.status,
        submissionReference: a.submissionReference,
        submittedAt: a.submittedAt,
        matchedProgram: a.matchedProgram,
        offerStatus: a.offerStatus,
        offerExpiresAt: a.offerExpiresAt,
      })),
      activeCycle: activeCycle
        ? {
            id: activeCycle._id,
            name: activeCycle.name,
            year: activeCycle.year,
            status: activeCycle.status,
            submissionDeadline: activeCycle.submissionDeadline,
            rankingDeadline: activeCycle.rankingDeadline,
            resultPublicationDate: activeCycle.resultPublicationDate,
          }
        : null,
    });
  } catch (error) {
    console.error('Applicant dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};