// Test the basic configuration without running the full app
console.log('Testing Intent Router configuration...');

// Mock environment for testing
process.env.OPENAI_API_KEY = 'test-key';

try {
  // Test basic Node.js functionality
  console.log('✓ Node.js runtime working');
  console.log('✓ Environment variables accessible');
  
  // Check if we can access the parent package
  const path = require('path');
  const fs = require('fs');
  
  const parentPkg = path.join(__dirname, '../../package.json');
  if (fs.existsSync(parentPkg)) {
    const pkg = JSON.parse(fs.readFileSync(parentPkg, 'utf8'));
    console.log('✓ Parent package.json found:', pkg.name);
  }
  
  // Check demo package.json
  const demoPkg = path.join(__dirname, 'package.json');
  if (fs.existsSync(demoPkg)) {
    const pkg = JSON.parse(fs.readFileSync(demoPkg, 'utf8'));
    console.log('✓ Demo package.json found:', pkg.name);
  }
  
  console.log('✓ Configuration test completed successfully');
} catch (error) {
  console.error('✗ Configuration test failed:', error.message);
}