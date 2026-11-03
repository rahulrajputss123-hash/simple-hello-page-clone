#!/usr/bin/env node
/**
 * Standalone test for TheoremReach HMAC-SHA1 hash verification
 * Run with: node test-theoremreach-hash.js
 */

import { createHmac } from 'crypto';

function generateTheoremReachHash(secret, callbackUrl) {
  const hmac = createHmac('sha1', secret);
  hmac.update(callbackUrl);
  const digest = hmac.digest();
  
  // Base64url encoding: replace + with -, / with _, remove =
  return digest
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function runTests() {
  console.log('TheoremReach HMAC-SHA1 Hash Verification Tests');
  console.log('==============================================\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Documented example from TheoremReach
  console.log('[TEST 1] Documented Example');
  const secret = 'ZZ6VkORqV25iSWOVb5cwZ03zpns';
  const url = 'https://www.abc.com/ex.aspx?abc=def&vid=123';
  const expectedHash = 'VNBMolYjJug6cDQqOX4oddfteDw';
  const actualHash = generateTheoremReachHash(secret, url);
  
  console.log(`  Secret: ${secret}`);
  console.log(`  URL: ${url}`);
  console.log(`  Expected: ${expectedHash}`);
  console.log(`  Actual:   ${actualHash}`);
  
  if (actualHash === expectedHash) {
    console.log('  ✓ PASS\n');
    passed++;
  } else {
    console.log('  ✗ FAIL\n');
    failed++;
  }
  
  // Test 2: Base64url format (no +, /, or =)
  console.log('[TEST 2] Base64url Format');
  const testHash = generateTheoremReachHash('test_secret', 'https://example.com/test?param=value');
  const hasPlus = testHash.includes('+');
  const hasSlash = testHash.includes('/');
  const hasEquals = testHash.includes('=');
  
  console.log(`  Hash: ${testHash}`);
  console.log(`  Contains +:  ${hasPlus}`);
  console.log(`  Contains /:  ${hasSlash}`);
  console.log(`  Contains =:  ${hasEquals}`);
  
  if (!hasPlus && !hasSlash && !hasEquals) {
    console.log('  ✓ PASS\n');
    passed++;
  } else {
    console.log('  ✗ FAIL\n');
    failed++;
  }
  
  // Test 3: Different URLs produce different hashes
  console.log('[TEST 3] Different URLs');
  const testSecret = 'test_secret';
  const url1 = 'https://example.com/callback?user=123&amount=1.00';
  const url2 = 'https://example.com/callback?user=123&amount=2.00';
  const hash1 = generateTheoremReachHash(testSecret, url1);
  const hash2 = generateTheoremReachHash(testSecret, url2);
  
  console.log(`  URL1: ${url1}`);
  console.log(`  Hash1: ${hash1}`);
  console.log(`  URL2: ${url2}`);
  console.log(`  Hash2: ${hash2}`);
  console.log(`  Different: ${hash1 !== hash2}`);
  
  if (hash1 !== hash2) {
    console.log('  ✓ PASS\n');
    passed++;
  } else {
    console.log('  ✗ FAIL\n');
    failed++;
  }
  
  // Test 4: Same URL produces same hash
  console.log('[TEST 4] Idempotency');
  const urlTest = 'https://example.com/callback?user=123';
  const hashA = generateTheoremReachHash(testSecret, urlTest);
  const hashB = generateTheoremReachHash(testSecret, urlTest);
  
  console.log(`  URL: ${urlTest}`);
  console.log(`  Hash A: ${hashA}`);
  console.log(`  Hash B: ${hashB}`);
  console.log(`  Same: ${hashA === hashB}`);
  
  if (hashA === hashB) {
    console.log('  ✓ PASS\n');
    passed++;
  } else {
    console.log('  ✗ FAIL\n');
    failed++;
  }
  
  // Summary
  console.log('==============================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('==============================================\n');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
