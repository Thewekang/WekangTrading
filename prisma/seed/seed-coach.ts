import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subMonths, format, getHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

// Market session calculation
function getMarketSession(hour: number): string {
  if (hour >= 0 && hour < 7) return 'ASIA';
  if (hour >= 7 && hour < 9) return 'OVERLAP'; // ASIA-EUROPE
  if (hour >= 9 && hour < 13) return 'EUROPE';
  if (hour >= 13 && hour < 16) return 'OVERLAP'; // EUROPE-US
  if (hour >= 16 && hour < 22) return 'US';
  return 'ASIA';
}

// Trader profiles with realistic characteristics
const traderProfiles = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@traders.com',
    // Consistent high performer
    winRateBase: 0.68,
    sopRateBase: 0.85,
    avgProfitPerTrade: 25,
    preferredSessions: ['EUROPE', 'OVERLAP'],
    tradingDaysPerWeek: 5,
    consistency: 0.9, // High consistency
  },
  {
    name: 'Michael Chen',
    email: 'michael@traders.com',
    // Good but inconsistent
    winRateBase: 0.62,
    sopRateBase: 0.75,
    avgProfitPerTrade: 20,
    preferredSessions: ['US', 'OVERLAP'],
    tradingDaysPerWeek: 4,
    consistency: 0.6, // Medium consistency
  },
  {
    name: 'Emma Williams',
    email: 'emma@traders.com',
    // Improving trader (started bad, getting better)
    winRateBase: 0.55,
    sopRateBase: 0.70,
    avgProfitPerTrade: 15,
    preferredSessions: ['ASIA', 'EUROPE'],
    tradingDaysPerWeek: 5,
    consistency: 0.7,
    improvement: 0.15, // 15% improvement over 3 months
  },
  {
    name: 'David Martinez',
    email: 'david@traders.com',
    // Struggling trader (needs coaching)
    winRateBase: 0.45,
    sopRateBase: 0.55,
    avgProfitPerTrade: 8,
    preferredSessions: ['US', 'ASIA'],
    tradingDaysPerWeek: 3,
    consistency: 0.5, // Low consistency
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa@traders.com',
    // Declining performer (needs intervention)
    winRateBase: 0.58,
    sopRateBase: 0.80,
    avgProfitPerTrade: 18,
    preferredSessions: ['EUROPE', 'US'],
    tradingDaysPerWeek: 4,
    consistency: 0.65,
    decline: 0.12, // 12% decline over 3 months
  },
];

async function main() {
  console.log('🔥 Flushing all existing data...');
  
  // Delete all data
  await prisma.individualTrade.deleteMany({});
  await prisma.dailySummary.deleteMany({});
  await prisma.userTarget.deleteMany({});
  await prisma.user.deleteMany({ where: { role: 'USER' } });
  
  console.log('✅ All user and trade data deleted');

  // Create admin user
  console.log('\n👤 Creating admin user...');
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
  console.log('✅ Admin user created');

  // Create trader users with 3 months of data
  console.log('\n👥 Creating traders with 3 months of trading data...');
  
  const startDate = subMonths(new Date(), 3);
  const endDate = new Date();

  for (const profile of traderProfiles) {
    console.log(`\n📊 Creating trader: ${profile.name}`);
    
    // Create user
    const userPassword = await bcrypt.hash('trader123', 10);
    const user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        passwordHash: userPassword,
        role: 'USER',
      },
    });

    // Generate trades over 3 months
    let currentDate = new Date(startDate);
    let totalTrades = 0;
    const dailyTradesMap = new Map<string, any[]>();

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Trade on specified days per week (randomly skip some days)
      const shouldTrade = Math.random() < (profile.tradingDaysPerWeek / 5);
      if (!shouldTrade) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Calculate improvement/decline factor based on time progression
      const daysFromStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const progressFactor = daysFromStart / totalDays;

      let winRateModifier = 0;
      if (profile.improvement) {
        winRateModifier = profile.improvement * progressFactor; // Gradual improvement
      } else if (profile.decline) {
        winRateModifier = -profile.decline * progressFactor; // Gradual decline
      }

      const dailyTrades: any[] = [];
      const dateKey = format(currentDate, 'yyyy-MM-dd');

      // Generate 3 trades per day at different times
      for (let i = 0; i < 3; i++) {
        // Pick preferred session
        const session = profile.preferredSessions[Math.floor(Math.random() * profile.preferredSessions.length)];
        
        // Generate time based on session
        let hour: number;
        if (session === 'ASIA') hour = Math.floor(Math.random() * 6) + 1; // 1-6 UTC
        else if (session === 'EUROPE') hour = Math.floor(Math.random() * 4) + 9; // 9-12 UTC
        else if (session === 'US') hour = Math.floor(Math.random() * 6) + 16; // 16-21 UTC
        else hour = Math.random() < 0.5 ? 8 : 14; // OVERLAP times

        const minute = Math.floor(Math.random() * 60);
        const tradeTime = setMinutes(setHours(new Date(currentDate), hour), minute);

        // Calculate if this trade wins (with consistency factor)
        const consistencyRandom = Math.random();
        const isConsistent = consistencyRandom < profile.consistency;
        
        let winRate = profile.winRateBase + winRateModifier;
        if (!isConsistent) {
          winRate *= 0.7; // Inconsistent trades have lower win rate
        }

        const isWin = Math.random() < winRate;
        const followsSOP = Math.random() < profile.sopRateBase;

        // Calculate P/L with realistic variance
        let profitLoss: number;
        if (isWin) {
          profitLoss = profile.avgProfitPerTrade * (0.8 + Math.random() * 0.4); // 80-120% of avg
        } else {
          profitLoss = -profile.avgProfitPerTrade * (0.5 + Math.random() * 0.3); // -50% to -80% of avg (good risk management)
        }

        dailyTrades.push({
          userId: user.id,
          tradeTimestamp: tradeTime,
          result: isWin ? 'WIN' : 'LOSS',
          sopFollowed: followsSOP,
          profitLossUsd: Math.round(profitLoss * 100) / 100,
          marketSession: session,
          notes: followsSOP ? 'Followed trading plan' : 'Deviated from plan',
        });

        totalTrades++;
      }

      // Store daily trades
      dailyTradesMap.set(dateKey, dailyTrades);

      currentDate = addDays(currentDate, 1);
    }

    // Bulk insert all trades
    const allTrades = Array.from(dailyTradesMap.values()).flat();
    await prisma.individualTrade.createMany({
      data: allTrades,
    });

    console.log(`  ✅ Created ${totalTrades} trades over 3 months`);
    
    // Calculate and create daily summaries
    console.log(`  📈 Calculating daily summaries...`);
    
    for (const [dateKey, trades] of dailyTradesMap) {
      const tradeDate = new Date(dateKey);
      
      const totalTrades = trades.length;
      const totalWins = trades.filter(t => t.result === 'WIN').length;
      const totalLosses = totalTrades - totalWins;
      const totalSopFollowed = trades.filter(t => t.sopFollowed).length;
      const netProfitLoss = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);

      // Count by session
      const sessionCounts = {
        ASIA: 0, EUROPE: 0, US: 0, OVERLAP: 0,
      };
      const sessionWins = {
        ASIA: 0, EUROPE: 0, US: 0, OVERLAP: 0,
      };

      trades.forEach(t => {
        sessionCounts[t.marketSession as keyof typeof sessionCounts]++;
        if (t.result === 'WIN') {
          sessionWins[t.marketSession as keyof typeof sessionWins]++;
        }
      });

      // Find best session
      let bestSession = 'ASIA';
      let bestWinRate = 0;
      for (const [session, count] of Object.entries(sessionCounts)) {
        if (count > 0) {
          const winRate = sessionWins[session as keyof typeof sessionWins] / count;
          if (winRate > bestWinRate) {
            bestWinRate = winRate;
            bestSession = session;
          }
        }
      }

      await prisma.dailySummary.create({
        data: {
          userId: user.id,
          tradeDate,
          totalTrades,
          totalWins,
          totalLosses,
          totalSopFollowed,
          totalSopNotFollowed: totalTrades - totalSopFollowed,
          totalProfitLossUsd: Math.round(netProfitLoss * 100) / 100,
          bestSession,
          asiaSessionTrades: sessionCounts.ASIA,
          europeSessionTrades: sessionCounts.EUROPE,
          usSessionTrades: sessionCounts.US,
          overlapSessionTrades: sessionCounts.OVERLAP,
          asiaSessionWins: sessionWins.ASIA,
          europeSessionWins: sessionWins.EUROPE,
          usSessionWins: sessionWins.US,
          overlapSessionWins: sessionWins.OVERLAP,
        },
      });
    }

    console.log(`  ✅ Created ${dailyTradesMap.size} daily summaries`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('Admin: admin@wekangtradingjournal.com / admin123');
  console.log('\nTraders (all use password: trader123):');
  traderProfiles.forEach(p => console.log(`  - ${p.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
