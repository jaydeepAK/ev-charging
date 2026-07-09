// Every file that needs DB access imports THIS, not `new PrismaClient()` directly.
// Creating multiple PrismaClient instances (one per file) opens multiple DB
// connection pools and will exhaust your DB's connection limit in production.
// One shared instance = one pool.

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
