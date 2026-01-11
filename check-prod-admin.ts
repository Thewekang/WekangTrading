import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMTA3NTgsImlkIjoiYWE0Y2IzM2ItMWZjMC00NDYyLThhY2UtMzVmOTc1Yzc5MjBhIiwicmlkIjoiMjdiNjc2NWEtZjhkMS00ODJkLThjMjItYTU4MTRjZjJlNTRhIn0.4bWlKa5n3EWEVNXs0B4yiDHQaSPjZ-wqp01bgQD_z1OHLm7g4FTQppMvp_lYMDU3ZTFL-nN0BIRrECcBFwxUAg'
});

async function checkAdmin() {
  const result = await db.execute('SELECT email, name, role FROM users WHERE role = "ADMIN"');
  console.log('Admin users in production:');
  console.log(JSON.stringify(result.rows, null, 2));
}

checkAdmin().catch(console.error);
