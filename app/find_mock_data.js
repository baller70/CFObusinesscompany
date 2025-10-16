const fs = require('fs');
const path = require('path');

const searchDir = 'app/dashboard';
const mockPatterns = [
  /const\s+\w*[Mm]ock\w*\s*=\s*\[/,
  /const\s+\w*[Ss]ample\w*\s*=\s*\[/,
  /const\s+\w*[Dd]ummy\w*\s*=\s*\[/,
  /const\s+\w*[Ff]ake\w*\s*=\s*\[/,
  /\/\/\s*[Mm]ock\s+data/i,
  /\/\/\s*[Ss]ample\s+data/i
];

function searchFiles(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      searchFiles(filePath, results);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        mockPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      });
    }
  });
  
  return results;
}

const results = searchFiles(searchDir);

if (results.length === 0) {
  console.log('✅ No mock data patterns found!');
} else {
  console.log(`Found ${results.length} potential mock data issues:\n`);
  results.forEach(result => {
    console.log(`📁 ${result.file}:${result.line}`);
    console.log(`   ${result.content}\n`);
  });
}
