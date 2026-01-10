import { createClient } from '@libsql/client';

async function main() {
  console.log('🔍 Checking production database for admin user...\n');

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  });

  // Check if admin exists
  const result = await client.execute({
    sql: 'SELECT id, email, name, role, created_at FROM users WHERE email = ?',
    args: ['admin@wekangtrading.com']
  });

  if (result.rows.length === 0) {
    console.log('❌ Admin user NOT FOUND in database!');
    console.log('   Run: npx tsx scripts/seed-production.ts');
  } else {
    console.log('✅ Admin user found in database:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  }

  // Check SOP types
  const sopResult = await client.execute('SELECT COUNT(*) as count FROM sop_types');
  console.log(`\n📊 SOP Types count: ${sopResult.rows[0].count}`);

  // Check all users
  const allUsers = await client.execute('SELECT email, role FROM users');
  console.log(`\n👥 Total users: ${allUsers.rows.length}`);
  allUsers.rows.forEach(user => {
    console.log(`   - ${user.email} (${user.role})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
