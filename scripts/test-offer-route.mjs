#!/usr/bin/env node
/**
 * Quick test script to verify offer route doesn't crash
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('[test] Starting build...');

const build = spawn('npm', ['run', 'build'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

build.on('close', (code) => {
  if (code !== 0) {
    console.error(`[test] Build failed with code ${code}`);
    process.exit(1);
  }
  
  console.log('[test] Build successful, starting preview server...');
  
  const preview = spawn('npm', ['run', 'preview'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
  });
  
  let serverReady = false;
  
  preview.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('Local:') && !serverReady) {
      serverReady = true;
      console.log('[test] Server ready! Open http://localhost:4173/offer/4b7e07ef-54d2-4845-8b65-73d80dfc2256');
      console.log('[test] Press Ctrl+C to stop');
    }
  });
  
  preview.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  preview.on('close', (code) => {
    console.log(`[test] Preview server exited with code ${code}`);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('[test] Shutting down...');
    preview.kill();
    process.exit(0);
  });
});
