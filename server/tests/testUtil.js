import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cloudinary from '../src/utils/cloudinary.js';
import extractPublicId from '../src/utils/extractPublicId.js';
import prisma from '../src/utils/database.js';

export const getTestRefreshToken = async () => {
  const user = await getTestUser();

  return await prisma.refreshToken.findFirst({
    where: {
      userId: user.id,
    },
  });
}

export const createTestRefreshToken = async () => {
  const user = await getTestUser();
  const token = jwt.sign(
    { 
      sub: user.id,
      role: user.role.name
    }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES }
  );

  return await prisma.refreshToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
}

export const removeAllTestRefreshToken = async () => {
  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        username: { startsWith: 'test' }
      }
    }
  });
}

export const getTestUser = async (username = 'test') => {
  return await prisma.user.findUnique({
    where: { username },
    include: { role: true }
  });
};

export const createTestUser = async (roleName, fields = {}) => {
  const role = await getTestRole(roleName);

  await prisma.user.create({
    data: {
      username: 'test',
      email: 'test@me.com',
      password: await bcrypt.hash('test123', 10),
      roleId: role.id,
      avatar: process.env.DEFAULT_AVATAR_URL,
      ...fields,
    },
  });
};

export const createManyTestUsers = async () => {
  const role = await getTestRole();

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
  return await prisma.user.update({
    where: {
      username: 'test',
    },
    data: fields,
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

export const getTestRole = async (name = 'test') => {
  return await prisma.role.findUnique({
    where: { name },
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


export const removeAllTestRoles = async () => {
  await prisma.role.deleteMany({
    where: {
      name: {
        startsWith: 'test',
      },
    },
  });
};

export const getTestProperty = async (name = 'test') => {
  return await prisma.property.findFirst({
    where: { name },
  });
};

export const createTestProperty = async (fields = {}) => {
  const user = await getTestUser();

  await prisma.property.create({
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
      ...fields
    },
  });
};

export const createManyTestProperties = async () => {
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
  const property = await prisma.property.findFirst({
    where: { name: 'test' },
  });

  return await prisma.property.update({
    where: { id: property.id },
    data: fields,
  });
};

export const removeAllTestProperties = async () => {
  await prisma.property.deleteMany({
    where: {
      name: {
        startsWith: 'test',
      },
    },
  });
};

export const createAccessToken = async () => {
  const user = await getTestUser();

  const payload = {
    sub: user.id,
    role: user.role.name,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  global.accessToken = accessToken;
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
