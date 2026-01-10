import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('🔄 Resetting admin user...\n');

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  });

  // Delete existing admin user
  console.log('🗑️  Deleting old admin user...');
  await client.execute({
    sql: 'DELETE FROM users WHERE email = ?',
    args: ['admin@wekangtrading.com']
  });

  // Create fresh admin user with new password hash
  const newPassword = 'WekangAdmin2026!';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  console.log('✨ Creating new admin user...');
  await client.execute({
    sql: `INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'admin-' + Date.now(),
      'admin@wekangtrading.com',
      passwordHash,
      'Admin',
      'ADMIN',
      new Date().toISOString(),
      new Date().toISOString()
    ]
  });

  console.log('\n✅ Admin user reset successfully!\n');
  console.log('📧 Email: admin@wekangtrading.com');
  console.log('🔑 Password: WekangAdmin2026!');
  console.log('\n⚠️  Try logging in now on your production site!');

  // Verify the user was created
  const verify = await client.execute({
    sql: 'SELECT id, email, role, created_at FROM users WHERE email = ?',
    args: ['admin@wekangtrading.com']
  });

  console.log('\n✅ Verification:');
  console.log(JSON.stringify(verify.rows[0], null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
