import { db } from '../lib/db';
import { users, sopTypes } from '../lib/db/schema';
import * as bcrypt from 'bcryptjs';

async function seedTestData() {
  console.log('🌱 Seeding test data with Drizzle...\n');

  try {
    // Create test user
    console.log('✓ Creating test user...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const [testUser] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash,
        role: 'USER',
      })
      .returning();

    console.log(`  User created: ${testUser.email} (${testUser.id})\n`);

    // Create admin user
    console.log('✓ Creating admin user...');
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash,
        role: 'ADMIN',
      })
      .returning();

    console.log(`  Admin created: ${adminUser.email} (${adminUser.id})\n`);

    // Create SOP types
    console.log('✓ Creating SOP types...');
    const sopTypeData = [
      { name: 'Trend Following', description: 'Following the main market trend', sortOrder: 1 },
      { name: 'Breakout', description: 'Trading breakouts from key levels', sortOrder: 2 },
      { name: 'Reversal', description: 'Counter-trend reversal trades', sortOrder: 3 },
      { name: 'Range Trading', description: 'Trading within defined ranges', sortOrder: 4 },
    ];

    await db
      .insert(sopTypes)
      .values(sopTypeData);

    console.log(`  Created ${sopTypeData.length} SOP types\n`);

    console.log('✅ Test data seeded successfully!\n');
    console.log('Test credentials:');
    console.log('  User: test@example.com / password123');
    console.log('  Admin: admin@example.com / password123\n');

  } catch (error) {
    console.error('❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  }
}

seedTestData();
