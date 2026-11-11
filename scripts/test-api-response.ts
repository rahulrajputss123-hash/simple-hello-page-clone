#!/usr/bin/env tsx
/**
 * Simulate what the frontend receives from getFeaturedFeed API
 */

import { config } from 'dotenv';
config();

// Set up fake request context for testing
process.env.CF_IPCOUNTRY = 'IN';
process.env.USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36';

async function main() {
  // Import after env is set
  const { getFeaturedFeedImpl } = await import('../src/lib/offers/feed-cache.server.js');
  
  console.log('\n=== Simulating API call ===');
  console.log('Country: IN');
  console.log('Platform: android');
  console.log('Scope: all\n');
  
  const result = await getFeaturedFeedImpl('IN', 'all', null, 'test-user-id', 'android');
  
  console.log(`Total offers: ${result.offers.length}`);
  
  const gamesOffers = result.offers.filter(o => o.category === 'Games');
  console.log(`Games offers: ${gamesOffers.length}`);
  
  if (gamesOffers.length > 0) {
    console.log('\nGames offers:');
    gamesOffers.slice(0, 10).forEach(g => {
      console.log(`  - ${g.title}`);
      console.log(`    Category: ${g.category}`);
      console.log(`    Devices: ${JSON.stringify(g.devices)}`);
    });
  } else {
    console.log('\n❌ NO GAMES OFFERS!');
  }
  
  // Check if category field exists at all
  const withCategory = result.offers.filter(o => o.category);
  console.log(`\nOffers with category field: ${withCategory.length}/${result.offers.length}`);
  
  if (withCategory.length > 0) {
    const categories = new Set(withCategory.map(o => o.category));
    console.log('Categories present:', Array.from(categories).sort());
  }
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
