const { PrismaClient } = require('../generated/prisma');

// Prevent multiple instances of Prisma Client in development
// which can exhaust the database connection limit.
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

module.exports = prisma;
