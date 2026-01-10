import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db';

async function main() {
  console.log('🌱 Starting production database seed...');

  // Create admin user (credentials can be changed after first login)
  const adminPassword = await bcrypt.hash('WekangAdmin2026!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wekangtrading.com' },
    update: {},
    create: {
      email: 'admin@wekangtrading.com',
      name: 'Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);
  console.log('📧 Email: admin@wekangtrading.com');
  console.log('🔑 Password: WekangAdmin2026!');
  console.log('⚠️  IMPORTANT: Change password after first login!');

  // Create default SOP types
  const defaultSopTypes = [
    { name: 'Trend Following', description: 'Trading with the main market trend', sortOrder: 1 },
    { name: 'Support/Resistance', description: 'Trading at key support and resistance levels', sortOrder: 2 },
    { name: 'Breakout', description: 'Trading price breakouts from consolidation', sortOrder: 3 },
    { name: 'Reversal', description: 'Identifying and trading trend reversals', sortOrder: 4 },
    { name: 'News Trading', description: 'Trading around major news events', sortOrder: 5 },
    { name: 'Scalping', description: 'Quick trades for small profits', sortOrder: 6 },
  ];

  for (const sopType of defaultSopTypes) {
    const created = await prisma.sopType.upsert({
      where: { name: sopType.name },
      update: {},
      create: {
        name: sopType.name,
        description: sopType.description,
        sortOrder: sopType.sortOrder,
        active: true,
      },
    });
    console.log('✅ Created SOP type:', created.name);
  }

  console.log('\n🎉 Production seed completed successfully!');
  console.log('📊 Summary:');
  console.log('   - 1 Admin account');
  console.log('   - 6 Default SOP types');
  console.log('   - 0 Test data');
  console.log('\n⚠️  REMEMBER: Update admin credentials after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
