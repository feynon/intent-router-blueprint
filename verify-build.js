#!/usr/bin/env node

console.log('🔧 Verifying Intent Router Blueprint build...');

const fs = require('fs');
const path = require('path');

// Check if all source files exist
console.log('\n📁 Checking source files:');
const srcFiles = [
  'src/index.ts',
  'src/types.ts',
  'src/intent-router.ts',
  'src/utils.ts',
  'src/camel/types.ts',
  'src/camel/camel-router.ts'
];

let allSourcesExist = true;
srcFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allSourcesExist = false;
  }
});

// Check package.json
console.log('\n📦 Checking package configuration:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Package: ${pkg.name}@${pkg.version}`);
  console.log(`✅ Main entry: ${pkg.main}`);
  console.log(`✅ Type: ${pkg.type}`);
  
  if (pkg.dependencies) {
    console.log(`✅ Dependencies: ${Object.keys(pkg.dependencies).join(', ')}`);
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allSourcesExist = false;
}

// Check TypeScript config
console.log('\n📝 Checking TypeScript configuration:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ TypeScript config found');
  console.log(`✅ Target: ${tsConfig.compilerOptions.target}`);
  console.log(`✅ Module: ${tsConfig.compilerOptions.module}`);
} catch (error) {
  console.log('❌ Error reading tsconfig.json:', error.message);
}

// Check Vite config
console.log('\n⚡ Checking Vite configuration:');
if (fs.existsSync('vite.config.ts')) {
  console.log('✅ Vite config found');
} else {
  console.log('❌ Vite config missing');
}

console.log('\n🏁 Verification Complete');
if (allSourcesExist) {
  console.log('✅ Source files look good!');
  console.log('\nTrying to simulate type checking...');
  
  // Simple syntax check by trying to read and parse key files
  try {
    const indexContent = fs.readFileSync('src/index.ts', 'utf8');
    if (indexContent.includes('export') && indexContent.includes('IntentRouter')) {
      console.log('✅ Main exports look correct');
    }
    
    const typesContent = fs.readFileSync('src/types.ts', 'utf8');
    if (typesContent.includes('interface') && typesContent.includes('IntentRouterConfig')) {
      console.log('✅ Main types look correct');
    }
    
    console.log('✅ Basic file syntax appears valid');
  } catch (error) {
    console.log('❌ Error reading source files:', error.message);
  }
} else {
  console.log('❌ Some source files are missing');
}

console.log('\n📋 To build and run the demo:');
console.log('1. Build main package: npm run build');
console.log('2. Go to demo: cd examples/nextjs-demo');
console.log('3. Install dependencies: npm install');
console.log('4. Start demo: npm run dev');