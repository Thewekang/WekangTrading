/**
 * Production Seed Script
 * Creates only the admin user - no sample data
 */

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@wekangtrading.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', existingAdmin.email);
    console.log('✅ Seed completed - no changes made');
    return;
  }

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcryptjs.hash('WekangAdmin2026!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@wekangtrading.com',
      name: 'Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('');
  console.log('📧 Email:', admin.email);
  console.log('🔑 Password: WekangAdmin2026!');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
  console.log('✨ Production seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
