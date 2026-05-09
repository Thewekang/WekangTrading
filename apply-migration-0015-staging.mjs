// Temporary script to apply migration 0015 to staging
// Run: node apply-migration-0015-staging.mjs

const DB_URL = 'https://wekangtrading-staging-thewekang.aws-eu-west-1.turso.io';
const AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgyMDk4MTYsImlkIjoiM2MwNzE2MmItM2UxMi00NTlkLWJjMDgtOTM4ZjZlYzZmNTBkIiwicmlkIjoiOTg0YzI0YmEtOWRhZS00NzI4LTljMzMtYzIzNWM3NDI1MDIyIn0.dEGs4fED_p_-_0zjBBoAk-kqw4516oWKGuVseGCl1PGXoeaPezCsBj7E_NRxVLazkyAJcujnldSSbQBw8MkQBQ';

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`trading_day_checklists\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`user_id\` text NOT NULL,
    \`trading_account_id\` text NOT NULL,
    \`trade_date\` text NOT NULL,
    \`item_states\` text DEFAULT '{}' NOT NULL,
    \`created_at\` integer NOT NULL,
    \`updated_at\` integer NOT NULL,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`trading_account_id\`) REFERENCES \`trading_accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS \`checklist_user_account_date_idx\` ON \`trading_day_checklists\` (\`user_id\`,\`trading_account_id\`,\`trade_date\`)`,
];

async function execSQL(sql) {
  const body = JSON.stringify({
    requests: [
      { type: 'execute', stmt: { sql } },
      { type: 'close' },
    ],
  });

  const res = await fetch(`${DB_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  const result = json.results?.[0];
  if (result?.type === 'error') {
    throw new Error(`SQL error: ${JSON.stringify(result.error)}`);
  }
  return json;
}

async function main() {
  console.log('Applying migration 0015 (trading_day_checklists) to staging...\n');
  for (const [i, sql] of STATEMENTS.entries()) {
    console.log(`Statement ${i + 1}/${STATEMENTS.length}: ${sql.trim().split('\n')[0].substring(0, 60)}...`);
    try {
      await execSQL(sql);
      console.log('  ✓ OK\n');
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}\n`);
    }
  }
  console.log('Done.');
}

main();
