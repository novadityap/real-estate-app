import { readFile } from 'node:fs/promises';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cloudinary from '../src/utils/cloudinary.js';
import extractPublicId from '../src/utils/extractPublicId.js';
import prisma from '../src/utils/database.js';
import crypto from 'crypto';

export const createTestBlacklist = async (fields = {}) => {
  await prisma.blacklist.create({
    data: {
      token: jwt.sign({ id: 1 }, process.env.JWT_REFRESH_SECRET),
      ...fields,
    },
  });
};

export const removeAllTestBlacklists = async () => {
  await prisma.blacklist.deleteMany({});
};

export const createTestUser = async (fields = {}) => {
  const role = await prisma.role.findFirst({
    where: {
      name: 'user',
    },
  });

  await prisma.user.create({
    data: {
      username: 'test',
      email: 'test@me.com',
      password: await bcrypt.hash('test123', 10),
      roleId: role.id,
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      avatar: process.env.DEFAULT_AVATAR_URL,
      ...fields,
    },
  });
};

export const createManyTestUsers = async () => {
  const role = await prisma.role.findFirst({
    where: {
      name: 'user',
    },
  });

  for (let i = 0; i < 15; i++) {
    await prisma.user.create({
      data: {
        username: `test${i}`,
        email: `test${i}@email.com`,
        password: await bcrypt.hash('test123', 10),
        roleId: role.id,
        avatar: process.env.DEFAULT_AVATAR_URL,
      },
    });
  }
};

export const updateTestUser = async (fields = {}) => {
  await prisma.user.update({
    where: {
      username: 'test',
    },
    data: fields,
  });
};

export const getTestUser = async (fields = {}) => {
  return await prisma.user.findUnique({
    where: {
      username: 'test',
      ...fields,
    },
  });
};

export const removeAllTestUsers = async () => {
  await prisma.user.deleteMany({
    where: {
      username: {
        startsWith: 'test',
      },
    },
  });
};

export const removeTestUser = async (fields = {}) => {
  await prisma.user.deleteMany({
    where: {
      username: 'test',
      ...fields,
    },
  });
};

export const createTestRole = async (fields = {}) => {
  await prisma.role.create({
    data: {
      name: 'test',
      ...fields,
    },
  });
};

export const createManyTestRoles = async () => {
  for (let i = 0; i < 15; i++) {
    await prisma.role.create({
      data: {
        name: `test${i}`,
      },
    });
  }
};

export const getTestRole = async () => {
  return await prisma.role.findUnique({
    where: {
      name: 'test',
    },
  });
};

export const removeAllTestRoles = async () => {
  await prisma.role.deleteMany({
    where: {
      name: {
        startsWith: 'test',
      },
    },
  });
};

export const removeTestRole = async (fields = {}) => {
  await prisma.role.deleteMany({
    where: {
      name: 'test',
      ...fields,
    },
  });
};

// export const createTestProperty = async (fields = {}) => {
//   const user = await createTestUser();

//   return await Post.create({
//     title: 'test',
//     price: 20.000,
//     decription: 'test',
//     type: 'HOME',
//     ownerId: user.id,
//     ...fields,
//   });
// };

export const createToken = (type, role, userId) => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    type === 'auth' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET,
    {
      expiresIn:
        type === 'auth'
          ? process.env.JWT_EXPIRES
          : process.env.JWT_REFRESH_EXPIRES,
    }
  );
};

export const checkFileExists = async url => {
  try {
    await cloudinary.api.resource(extractPublicId(url));
    return true;
  } catch (e) {
    return false;
  }
};

export const removeTestFile = async url => {
  await cloudinary.uploader.destroy(extractPublicId(url));
};
