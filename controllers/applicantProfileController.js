const ApplicantProfile = require('../models/ApplicantProfile');

const requiredForComplete = [
  'dateOfBirth', 'gender', 'nationality', 'phone',
  'medicalSchool', 'graduationYear',
];

const checkCompleteness = (profile) => {
  return requiredForComplete.every((field) => {
    const value = profile[field];
    return value !== undefined && value !== null && value !== '';
  });
};

exports.getMyProfile = async (req, res) => {
  try {
    let profile = await ApplicantProfile.findOne({ user: req.user._id })
      .populate('medicalSchool', 'name code');
    if (!profile) {
      profile = await ApplicantProfile.create({ user: req.user._id });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { user, _id, createdAt, updatedAt, ...updates } = req.body;

    let profile = await ApplicantProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new ApplicantProfile({ user: req.user._id });
    }

    Object.assign(profile, updates);
    profile.profileCompleted = checkCompleteness(profile);
    await profile.save();

    const populated = await ApplicantProfile.findById(profile._id)
      .populate('medicalSchool', 'name code');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};