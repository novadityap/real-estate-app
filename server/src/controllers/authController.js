import validate from '../utils/validate.js';
import ResponseError from '../utils/responseError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import ejs from 'ejs';
import sendMail from '../utils/sendMail.js';
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  resetPasswordSchema,
} from '../validations/userValidation.js';
import prisma from '../utils/database.js';

const signup = async (req, res, next) => {
  try {
    const fields = validate(signupSchema, req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: fields.username }, { email: fields.email }],
      },
    });

    if (user) {
      logger.warn('user already exists');
      return res.json({
        code: 200,
        message: 'Please check your email to verify your account',
      });
    }

    const userRole = await prisma.role.findFirst({
      where: {
        name: 'user',
      },
    });

    fields.password = await bcrypt.hash(fields.password, 10);

    const newUser = await prisma.user.create({
      data: {
        ...fields,
        roleId: userRole.id,
        avatar: process.env.DEFAULT_AVATAR_URL,
        verificationToken: crypto.randomBytes(32).toString('hex'),
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const html = await ejs.renderFile('./src/views/verifyEmail.ejs', {
      username: newUser.username,
      url: `${process.env.CLIENT_URL}/verify-email/${newUser.verificationToken}`,
    });

    await sendMail(newUser.email, 'Verify Email', html);

    logger.info('verification email sent successfully');
    res.json({
      code: 200,
      message: 'Please check your email to verify your account',
    });
  } catch (e) {
    next(e);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: req.params.verificationToken,
        verificationTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn('verification token is invalid or has expired');
      throw new ResponseError(
        'Verification token is invalid or has expired',
        401
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        avatar: process.env.DEFAULT_AVATAR_URL,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    logger.info('email verified successfully');
    res.json({
      code: 200,
      message: 'Email verified successfully',
    });
  } catch (e) {
    next(e);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const fields = validate(verifyEmailSchema, req.body);

    const user = await prisma.user.findFirst({
      where: {
        email: fields.email,
        isVerified: false,
      },
    });

    if (!user) {
      logger.warn('user is not registered');
      return res.json({
        code: 200,
        message: 'Please check your email to verify your account',
      });
    }

    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verificationToken: crypto.randomBytes(32).toString('hex'),
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const html = await ejs.renderFile('./src/views/verifyEmail.ejs', {
      username: user.username,
      url: `${process.env.CLIENT_URL}/verify-email/${user.verificationToken}`,
    });

    await sendMail(user.email, 'Verify Email', html);
    logger.info('verification email sent successfully');

    res.json({
      code: 200,
      message: 'Please check your email to verify your account',
    });
  } catch (e) {
    next(e);
  }
};

const signin = async (req, res, next) => {
  try {
    const fields = validate(signinSchema, req.body);

    const user = await prisma.user.findFirst({
      where: {
        email: fields.email,
        isVerified: true,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      logger.warn('user is not registered');
      throw new ResponseError('Email or password is invalid', 401);
    }

    const isMatch = await bcrypt.compare(fields.password, user.password);
    if (!isMatch) {
      logger.warn('email or password is invalid');
      throw new ResponseError('Email or password is invalid', 401);
    }

    const payload = { id: user.id, role: user.role.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    logger.info('signed in successfully');
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        code: 200,
        message: 'Signed in successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role.name,
          token,
        },
      });
  } catch (e) {
    next(e);
  }
};

const signout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      logger.warn('refresh token is not provided');
      throw new ResponseError('Refresh token is not provided', 401);
    }

    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
      },
    });

    if (!user) {
      logger.warn('refresh token not found in the database');
      throw new ResponseError('Refresh token is invalid', 401);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: null,
      },
    });

    await prisma.blacklist.create({
      data: {
        token: refreshToken,
      },
    });

    logger.info('signed out successfully');
    res.clearCookie('refreshToken');
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      logger.warn('refresh token is not provided');
      throw new ResponseError('Refresh token is not provided', 401);
    }

    const blacklistedToken = await prisma.blacklist.findFirst({
      where: {
        token: refreshToken,
      },
    });

    if (blacklistedToken) {
      logger.warn('refresh token has blacklisted');
      throw new ResponseError('Refresh token is invalid', 401);
    }

    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      logger.warn('refresh token not found in the database');
      throw new ResponseError('Refresh token is invalid', 401);
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          logger.warn('refresh token has expired');
          throw new ResponseError('Refresh token has expired', 401);
        }

        logger.warn('refresh token is invalid');
        throw new ResponseError('Refresh token is invalid', 401);
      }
    });

    const newToken = jwt.sign(
      { id: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    logger.info('token refreshed successfully');
    res.json({
      code: 200,
      message: 'Token refreshed successfully',
      data: { token: newToken },
    });
  } catch (e) {
    next(e);
  }
};

const requestResetPassword = async (req, res, next) => {
  try {
    const fields = validate(verifyEmailSchema, req.body);

    const user = await prisma.user.findFirst({
      where: {
        email: fields.email,
        isVerified: true,
      },
    });

    if (!user) {
      logger.warn('user is not registered');
      return res.json({
        code: 200,
        message: 'Please check your email to reset your password',
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken: crypto.randomBytes(32).toString('hex'),
        resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const html = await ejs.renderFile('./src/views/resetPassword.ejs', {
      username: user.username,
      url: `${process.env.CLIENT_URL}/reset-password/${user.resetToken}`,
    });

    await sendMail(user.email, 'Reset Password', html);

    logger.info('reset password email sent successfully');
    res.json({
      code: 200,
      message: 'Please check your email to reset your password',
    });
  } catch (e) {
    next(e);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const fields = validate(resetPasswordSchema, req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: req.params.resetToken,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn('reset token is invalid or has expired');
      throw new ResponseError('Reset token is invalid or has expired', 401);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await bcrypt.hash(fields.newPassword, 10),
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    logger.info('password reset successfully');
    res.json({
      code: 200,
      message: 'Password reset successfully',
    });
  } catch (e) {
    next(e);
  }
};

export default {
  signup,
  signin,
  signout,
  refreshToken,
  requestResetPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
