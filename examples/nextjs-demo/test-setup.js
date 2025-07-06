#!/usr/bin/env node

console.log('Testing Next.js Demo Setup...');

const fs = require('fs');
const path = require('path');

// Check required files
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  '.env.local',
  'app/layout.tsx',
  'app/page.tsx',
  'components/IntentInterface.tsx',
  'lib/intent-router.ts'
];

console.log('\n📁 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Package name: ${pkg.name}`);
  console.log(`✅ Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
  console.log(`✅ Dev dependencies: ${Object.keys(pkg.devDependencies || {}).length}`);
  
  // Check critical dependencies
  const criticalDeps = ['next', 'react', 'intent-router-blueprint'];
  criticalDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`✅ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - Missing dependency!`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Check environment variables
console.log('\n🔑 Checking environment:');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  if (envContent.includes('OPENAI_API_KEY') || envContent.includes('ANTHROPIC_API_KEY')) {
    console.log('✅ API key configured');
  } else {
    console.log('❌ No API key found in .env.local');
  }
} catch (error) {
  console.log('❌ Error reading .env.local:', error.message);
}

// Check parent package
console.log('\n🔧 Checking parent package:');
const parentPkg = path.join(__dirname, '../../package.json');
if (fs.existsSync(parentPkg)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(parentPkg, 'utf8'));
    console.log(`✅ Parent package: ${pkg.name}`);
  } catch (error) {
    console.log('❌ Error reading parent package.json:', error.message);
  }
} else {
  console.log('❌ Parent package.json not found');
}

console.log('\n🏁 Setup Check Complete');
if (allFilesExist) {
  console.log('✅ All checks passed! Ready to install and run.');
  console.log('\nNext steps:');
  console.log('1. npm install');
  console.log('2. npm run dev');
} else {
  console.log('❌ Some issues found. Please fix them before running the demo.');
}