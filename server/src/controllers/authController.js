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
  const fields = validate(signupSchema, req.body);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: fields.username }, { email: fields.email }],
    },
  });

  const errors = {};

  if (user) {
    if (user.username === fields.username) {
      errors.username = 'Username already in use';
    }
    if (user.email === fields.email) {
      errors.email = 'Email already in use';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ResponseError('Validation errors', 400, errors);
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
  res.status(200).json({
    code: 200,
    message: 'Please check your email to verify your account',
  });
};

const verifyEmail = async (req, res, next) => {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: req.params.verificationToken,
      verificationTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
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
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  logger.info('email verified successfully');
  res.status(200).json({
    code: 200,
    message: 'Email verified successfully',
  });
};

const resendVerification = async (req, res, next) => {
  const fields = validate(verifyEmailSchema, req.body);

  const user = await prisma.user.findFirst({
    where: {
      email: fields.email,
      isVerified: false,
    },
  });

  if (!user) {
    throw new ResponseError('Validation errors', 400, {
      email: 'Email is not registered',
    });
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const html = await ejs.renderFile('./src/views/verifyEmail.ejs', {
    username: updatedUser.username,
    url: `${process.env.CLIENT_URL}/verify-email/${updatedUser.verificationToken}`,
  });

  await sendMail(updatedUser.email, 'Verify Email', html);
  logger.info('verification email sent successfully');

  res.status(200).json({
    code: 200,
    message: 'Please check your email to verify your account',
  });
};

const signin = async (req, res, next) => {
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

  if (!user || !(await bcrypt.compare(fields.password, user.password)))
    throw new ResponseError('Email or password is invalid', 401);

  const payload = { sub: user.id, role: user.role.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });
  const decodedRefreshToken = jwt.decode(refreshToken);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
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
};

const signout = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    throw new ResponseError('Refresh token is not provided', 401);

  const deletedToken = await prisma.refreshToken.deleteMany({
    where: {
      token: refreshToken,
    },
  });

  if (deletedToken.count === 0)
    throw new ResponseError('Refresh token is invalid', 401);

  logger.info('signed out successfully');
  res.clearCookie('refreshToken');
  res.sendStatus(204);
};

const refreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    throw new ResponseError('Refresh token is not provided', 401);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!storedToken) throw new ResponseError('Refresh token is invalid', 401);

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError')
        throw new ResponseError('Refresh token has expired', 401);

      throw new ResponseError('Refresh token is invalid', 401);
    }
  });

  const newToken = jwt.sign(
    { sub: storedToken.user.id, role: storedToken.user.role.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  logger.info('token refreshed successfully');
  res.status(200).json({
    code: 200,
    message: 'Token refreshed successfully',
    data: { token: newToken },
  });
};

const requestResetPassword = async (req, res, next) => {
  const fields = validate(verifyEmailSchema, req.body);

  const user = await prisma.user.findFirst({
    where: {
      email: fields.email,
      isVerified: true,
    },
  });

  if (!user) {
    throw new ResponseError('Validation errors', 400, {
      email: 'Email is not registered',
    });
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetToken: crypto.randomBytes(32).toString('hex'),
      resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const html = await ejs.renderFile('./src/views/resetPassword.ejs', {
    username: updatedUser.username,
    url: `${process.env.CLIENT_URL}/reset-password/${updatedUser.resetToken}`,
  });

  await sendMail(updatedUser.email, 'Reset Password', html);

  logger.info('reset password email sent successfully');
  res.status(200).json({
    code: 200,
    message: 'Please check your email to reset your password',
  });
};

const resetPassword = async (req, res, next) => {
  const fields = validate(resetPasswordSchema, req.body);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: req.params.resetToken,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user)
    throw new ResponseError('Reset token is invalid or has expired', 401);

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
  res.status(200).json({
    code: 200,
    message: 'Password reset successfully',
  });
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
