// This file sets up and exports the Prisma client
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Using JavaScript-friendly approach instead of TypeScript type assertions
const globalForPrisma = global;

// Usar solo errores en producción y desarrollo
export const prisma = 
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error']
  });

// Attach prisma to global in non-production environments
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
