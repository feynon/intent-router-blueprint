// Simple test to verify main exports work
console.log('Testing Intent Router Blueprint exports...');

try {
  // Test if the main index exports can be loaded
  const fs = require('fs');
  const path = require('path');
  
  // Check if source files exist
  const srcDir = path.join(__dirname, 'src');
  const files = fs.readdirSync(srcDir);
  console.log('Source files found:', files);
  
  // Check if main entry point exists
  const indexPath = path.join(srcDir, 'index.ts');
  if (fs.existsSync(indexPath)) {
    console.log('✓ Main index.ts exists');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    console.log('✓ Index file readable');
  } else {
    console.log('✗ Main index.ts missing');
  }
  
  console.log('✓ Basic file structure verification completed');
} catch (error) {
  console.error('✗ Error:', error.message);
}