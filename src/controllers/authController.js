const User = require('../models/User');
const { signToken } = require('../utils/token');
const { logger } = require('../utils/logger');
const AppError = require('../utils/AppError');

async function register(req, res, next) {
  try {
    const { email, password, profile, role } = req.validated.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return next(AppError.conflict('Cet e-mail est déjà enregistré', { email }));
    }

    const user = new User({ email, password, profile, role });
    await user.save();

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    });
  } catch (err) {
    logger.error('Erreur inscription', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(AppError.unauthorized('E-mail ou mot de passe incorrect'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(AppError.unauthorized('E-mail ou mot de passe incorrect'));
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    user.metadata.lastLogin = new Date();
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    });
  } catch (err) {
    logger.error('Erreur connexion', { message: err.message, stack: err.stack });
    next(err);
  }
}

module.exports = {
  register,
  login,
};
