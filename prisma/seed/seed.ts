import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wekangtradingjournal.com' },
    update: {},
    create: {
      email: 'admin@wekangtradingjournal.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test traders
  const traderPassword = await bcrypt.hash('trader123', 10);
  
  const traders = [
    { email: 'trader1@example.com', name: 'John Trader' },
    { email: 'trader2@example.com', name: 'Sarah Smith' },
    { email: 'trader3@example.com', name: 'Mike Johnson' },
    { email: 'trader4@example.com', name: 'Lisa Chen' },
    { email: 'trader5@example.com', name: 'David Brown' },
  ];

  for (const trader of traders) {
    const user = await prisma.user.upsert({
      where: { email: trader.email },
      update: {},
      create: {
        email: trader.email,
        name: trader.name,
        passwordHash: traderPassword,
        role: 'USER',
      },
    });
    console.log('✅ Created trader:', user.email);
  }

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

  console.log('🎉 Database seed complete!');
  console.log('\n📝 Test Accounts Created:');
  console.log('Admin: admin@wekangtradingjournal.com / admin123');
  console.log('Traders: trader1@example.com - trader5@example.com / trader123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
