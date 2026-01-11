import { createClient } from '@libsql/client';

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');
  
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Check users
    const users = await client.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Users: ${users.rows[0].count}`);

    // Check trades
    const trades = await client.execute('SELECT COUNT(*) as count FROM individual_trades');
    console.log(`Individual Trades: ${trades.rows[0].count}`);

    // Check summaries
    const summaries = await client.execute('SELECT COUNT(*) as count FROM daily_summaries');
    console.log(`Daily Summaries: ${summaries.rows[0].count}`);

    // Check SOP types
    const sopTypes = await client.execute('SELECT COUNT(*) as count FROM sop_types');
    console.log(`SOP Types: ${sopTypes.rows[0].count}`);

    // Check invite codes
    const invites = await client.execute('SELECT COUNT(*) as count FROM invite_codes');
    console.log(`Invite Codes: ${invites.rows[0].count}\n`);

    console.log('✅ Database check complete!\n');

  } catch (error) {
    console.error('❌ Database check failed:');
    console.error(error);
    process.exit(1);
  }
}

checkDatabase();
