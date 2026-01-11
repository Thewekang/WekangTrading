/**
 * Test script to verify timezone and session calculations
 */

import { calculateMarketSession, getSessionName } from '../lib/utils/marketSessions';
import { DEFAULT_TIMEZONE, TIMEZONE_OFFSET } from '../lib/constants';

console.log('\n🧪 Testing Market Session Calculations\n');
console.log(`Default Timezone: ${DEFAULT_TIMEZONE} (GMT+${TIMEZONE_OFFSET})`);
console.log('\n' + '='.repeat(80) + '\n');

// Test different hours of the day
const testCases = [
  { hour: 8, minute: 0, description: 'Morning Asia session' },
  { hour: 15, minute: 30, description: 'Asia-Europe Overlap (afternoon)' },
  { hour: 16, minute: 30, description: 'Evening - after overlap' },
  { hour: 21, minute: 30, description: 'Europe-US Overlap (night)' },
  { hour: 23, minute: 0, description: 'Late evening US session' },
  { hour: 2, minute: 0, description: 'Early morning US session' },
];

for (const testCase of testCases) {
  // Create UTC date
  const utcDate = new Date();
  utcDate.setUTCHours(testCase.hour, testCase.minute, 0, 0);
  
  // Calculate MYT time (UTC + 8)
  const mytHour = (testCase.hour + TIMEZONE_OFFSET) % 24;
  const mytTime = `${mytHour.toString().padStart(2, '0')}:${testCase.minute.toString().padStart(2, '0')} MYT`;
  
  const session = calculateMarketSession(utcDate);
  const sessionName = getSessionName(session);
  
  console.log(`📍 ${testCase.description}`);
  console.log(`   UTC: ${testCase.hour.toString().padStart(2, '0')}:${testCase.minute.toString().padStart(2, '0')}`);
  console.log(`   MYT: ${mytTime}`);
  console.log(`   Session: ${sessionName}`);
  console.log('');
}

console.log('='.repeat(80));
console.log('\n✅ Session calculation test completed!\n');
