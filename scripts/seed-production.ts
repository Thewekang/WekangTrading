import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting production database seed with direct Turso client...\n');

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('WekangAdmin2026!', 10);
  
  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, email, password_hash, name, role, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'admin-default-id',
        'admin@wekangtrading.com',
        adminPassword,
        'Admin',
        'ADMIN',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    });
    console.log('✅ Created admin user: admin@wekangtrading.com');
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      console.log('⚠️  Admin user already exists');
    } else {
      throw error;
    }
  }

  // Create SOP types
  const sopTypes = [
    'Trend Following',
    'Support/Resistance',
    'Breakout',
    'Reversal',
    'News Trading',
    'Scalping'
  ];

  for (const sopType of sopTypes) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO sop_types (id, name, created_at, updated_at) 
              VALUES (?, ?, ?, ?)`,
        args: [
          `sop-${sopType.toLowerCase().replace(/[\/\s]/g, '-')}`,
          sopType,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });
      console.log(`✅ Created SOP type: ${sopType}`);
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        console.log(`⚠️  SOP type already exists: ${sopType}`);
      } else {
        throw error;
      }
    }
  }

  console.log('\n🎉 Production seed completed successfully!');
  console.log('📊 Summary:');
  console.log('   - 1 Admin account');
  console.log('   - 6 Default SOP types');
  console.log('   - 0 Test data\n');
  console.log('📧 Email: admin@wekangtrading.com');
  console.log('🔑 Password: WekangAdmin2026!\n');
  console.log('⚠️  REMEMBER: Update admin credentials after first login!\n');
}

main()
  .then(() => {
    console.log('✅ Seed process complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  });
