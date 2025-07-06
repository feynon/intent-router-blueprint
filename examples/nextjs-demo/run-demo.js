#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🎬 Starting Next.js Demo...');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Dependencies not installed. Installing now...');
  
  const install = spawn('npm', ['install', '--legacy-peer-deps'], {
    stdio: 'inherit',
    shell: true
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startDemo();
    } else {
      console.error('❌ Installation failed. Please install manually.');
    }
  });
} else {
  startDemo();
}

function startDemo() {
  console.log('🚀 Starting development server...');
  
  // Check environment
  if (!fs.existsSync('.env.local')) {
    console.log('⚠️ No .env.local found. Please copy .env.local.example and add your API key.');
  }
  
  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  dev.on('close', (code) => {
    console.log('Demo stopped with code:', code);
  });
  
  dev.on('error', (error) => {
    console.error('❌ Failed to start demo:', error.message);
    console.log('\n🔧 Manual start:');
    console.log('npm run dev');
  });
}