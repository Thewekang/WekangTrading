/**
 * Phase 3 Readiness Verification Script
 * 
 * Checks if database and codebase are ready for Phase 3 testing
 */

import { db } from '@/lib/db';
import { sopTypes } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

async function verifyPhase3Readiness() {
  console.log('🔍 Feature 5 - Phase 3 Readiness Check\n');
  console.log('=' .repeat(60));
  
  const checks = [];
  
  try {
    // Check 1: Database connection
    console.log('\n1️⃣ Database Connection...');
    await db.execute(sql`SELECT 1`);
    checks.push({ name: 'Database Connection', status: '✅' });
    console.log('   ✅ Connected to wekangtrading-staging');
    
    // Check 2: sop_types table structure
    console.log('\n2️⃣ Table Structure...');
    const tableInfo = await db.execute(sql`PRAGMA table_info(sop_types)`);
    const columns = (tableInfo.rows as any[]).map((r: any) => r.name);
    
    const requiredColumns = [
      'detail_content_short',
      'detail_content_long',
      'detail_enabled_short',
      'detail_enabled_long',
      'detail_updated_at',
      'detail_updated_by'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length === 0) {
      checks.push({ name: 'Table Structure', status: '✅' });
      console.log('   ✅ All SHORT/LONG detail columns exist');
    } else {
      checks.push({ name: 'Table Structure', status: '❌' });
      console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}`);
    }
    
    // Check 3: Existing SOP types
    console.log('\n3️⃣ Existing SOP Types...');
    const existingSOPs = await db.select().from(sopTypes);
    
    if (existingSOPs.length > 0) {
      checks.push({ name: 'SOP Types Data', status: '✅' });
      console.log(`   ✅ Found ${existingSOPs.length} SOP types:`);
      existingSOPs.forEach((sop, idx) => {
        const shortStatus = sop.detailEnabledShort ? '✅' : '⚠️';
        const longStatus = sop.detailEnabledLong ? '✅' : '⚠️';
        console.log(`      ${idx + 1}. ${sop.name}`);
        console.log(`         - SHORT: ${shortStatus} ${sop.detailEnabledShort ? 'Enabled' : 'Disabled'}`);
        console.log(`         - LONG: ${longStatus} ${sop.detailEnabledLong ? 'Enabled' : 'Disabled'}`);
      });
    } else {
      checks.push({ name: 'SOP Types Data', status: '⚠️' });
      console.log('   ⚠️  No SOP types found. Create some for testing.');
    }
    
    // Check 4: Indexes
    console.log('\n4️⃣ Database Indexes...');
    const indexes = await db.execute(sql`
      SELECT name 
      FROM sqlite_master 
      WHERE type = 'index' 
      AND tbl_name = 'sop_types' 
      AND name NOT LIKE 'sqlite_%'
    `);
    
    const indexNames = (indexes.rows as any[]).map((r: any) => r.name);
    
    if (indexNames.includes('sop_types_detail_enabled_short_idx') && 
        indexNames.includes('sop_types_detail_enabled_long_idx')) {
      checks.push({ name: 'Database Indexes', status: '✅' });
      console.log('   ✅ SHORT/LONG enable indexes exist');
    } else {
      checks.push({ name: 'Database Indexes', status: '⚠️' });
      console.log('   ⚠️  Missing some indexes (performance may be affected)');
    }
    
    // Check 5: Test detail content
    console.log('\n5️⃣ Detail Content Status...');
    const sopsWithDetails = existingSOPs.filter(sop => 
      (sop.detailContentShort && sop.detailContentShort.length > 0) ||
      (sop.detailContentLong && sop.detailContentLong.length > 0)
    );
    
    if (sopsWithDetails.length > 0) {
      checks.push({ name: 'Detail Content', status: '✅' });
      console.log(`   ✅ ${sopsWithDetails.length} SOP(s) have detail content`);
    } else {
      checks.push({ name: 'Detail Content', status: '⚠️' });
      console.log('   ⚠️  No detail content yet. Add some during testing.');
    }
    
    // Check 6: Sample detail content size
    console.log('\n6️⃣ Content Size Check...');
    if (sopsWithDetails.length > 0) {
      const sampleSOP = sopsWithDetails[0];
      const shortSize = sampleSOP.detailContentShort?.length || 0;
      const longSize = sampleSOP.detailContentLong?.length || 0;
      
      console.log(`   📊 Sample: "${sampleSOP.name}"`);
      console.log(`      - SHORT content: ${shortSize} chars`);
      console.log(`      - LONG content: ${longSize} chars`);
      
      if (shortSize > 50000 || longSize > 50000) {
        checks.push({ name: 'Content Size', status: '⚠️' });
        console.log('   ⚠️  Large content detected (may affect performance)');
      } else {
        checks.push({ name: 'Content Size', status: '✅' });
        console.log('   ✅ Content sizes within normal range');
      }
    } else {
      checks.push({ name: 'Content Size', status: 'ℹ️' });
      console.log('   ℹ️  No content to check yet');
    }
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    checks.push({ name: 'Verification', status: '❌' });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 VERIFICATION SUMMARY\n');
  
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
  });
  
  const passedChecks = checks.filter(c => c.status === '✅').length;
  const totalChecks = checks.filter(c => c.status !== 'ℹ️').length;
  
  console.log(`\n✅ Passed: ${passedChecks} / ${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 Phase 3 is ready for testing!');
    console.log('\nNext Steps:');
    console.log('1. Open http://localhost:3000/admin/sop-types');
    console.log('2. Follow testing guide: /docs/features/FEATURE-5-TESTING-PHASE-3.md');
    console.log('3. Test all 12 test cases');
    console.log('4. Report any bugs or issues\n');
  } else {
    console.log('\n⚠️  Some checks failed. Review issues above before testing.\n');
  }
  
  process.exit(0);
}

// Run verification
verifyPhase3Readiness().catch(console.error);
