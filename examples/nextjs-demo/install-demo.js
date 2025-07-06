#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Next.js Demo Dependencies...');

// Ensure we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Make sure you\'re in the demo directory.');
  process.exit(1);
}

// Check if parent dist exists
const parentDist = path.join('..', '..', 'dist', 'index.js');
if (!fs.existsSync(parentDist)) {
  console.log('⚠️ Parent package dist not found. Using stub build.');
}

// Install dependencies
console.log('📦 Running npm install...');

const npmInstall = spawn('npm', ['install', '--legacy-peer-deps'], {
  stdio: 'inherit',
  shell: true
});

npmInstall.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Dependencies installed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Make sure Ollama is running: ollama serve');
    console.log('2. Pull the model: ollama pull qwen2.5:4b');
    console.log('3. Start the demo: npm run dev');
    console.log('4. Open http://localhost:3000');
  } else {
    console.error('❌ npm install failed with code:', code);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Try: npm install --legacy-peer-deps --force');
    console.log('- Check if Node.js version is compatible');
    console.log('- Ensure parent package is built');
  }
});

npmInstall.on('error', (error) => {
  console.error('❌ Failed to start npm install:', error.message);
});