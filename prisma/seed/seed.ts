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
