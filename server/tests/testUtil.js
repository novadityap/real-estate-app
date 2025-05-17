import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cloudinary from '../src/utils/cloudinary.js';
import extractPublicId from '../src/utils/extractPublicId.js';
import prisma from '../src/utils/database.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

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
    include: {
      properties: {
        select: {
          images: true,
        },
      },
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

export const createTestProperty = async (fields = {}) => {
  await createTestUser();
  const user = await getTestUser();

  return await prisma.property.create({
    data: {
      name: 'test',
      description: 'test',
      address: 'test',
      regularPrice: 10.0,
      discountPrice: 5.0,
      bathroom: 2,
      bedroom: 5,
      parking: true,
      furnished: false,
      offer: true,
      type: 'sale',
      ownerId: user.id,
      ...fields,
    },
  });
};

export const createManyTestProperties = async () => {
  await createTestUser();
  const user = await getTestUser();

  for (let i = 0; i < 15; i++) {
    await prisma.property.create({
      data: {
        name: `test`,
        description: `test${i}`,
        address: `test${i}`,
        regularPrice: 10.0,
        discountPrice: 5.0,
        bathroom: 2,
        bedroom: 5,
        parking: true,
        furnished: false,
        offer: true,
        type: 'sale',
        ownerId: user.id,
      },
    });
  }
};

export const updateTestProperty = async (fields = {}) => {
  const property = await getTestProperty();
  await prisma.property.update({
    where: {
      id: property.id,
    },
    data: fields,
  });
};

export const getTestProperty = async (fields = {}) => {
  return await prisma.property.findFirst({
    where: {
      name: 'test',
      ...fields,
    },
  });
};

export const removeAllTestProperties = async (fields = {}) => {
  await prisma.property.deleteMany({
    where: {
      name: 'test',
      ...fields,
    },
  });
};

export const createToken = (type, role, userId) => {
  const secret =
    type === 'auth' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;

  const expiresIn =
    type === 'auth' ? process.env.JWT_EXPIRES : process.env.JWT_REFRESH_EXPIRES;

  const payload = {
    id: userId || uuidv4(),
    role,
  };

  return jwt.sign(payload, secret, { expiresIn });
};

export const checkFileExists = async url => {
  try {
    const urls = Array.isArray(url) ? url : [url];
    for (const item of urls) {
      await cloudinary.api.resource(extractPublicId(item));
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const removeTestFile = async url => {
  const urls = Array.isArray(url) ? url : [url];

  for (const item of urls) {
    await cloudinary.uploader.destroy(extractPublicId(item));
  }
};
