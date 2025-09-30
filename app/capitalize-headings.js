const fs = require('fs');
const path = require('path');

function capitalizeHeading(text) {
  // Convert to uppercase, handling special cases
  return text.toUpperCase();
}

function updateHeadingsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Pattern to match h1-h6 elements with their content
    const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
    
    content = content.replace(headingRegex, (match, tag, innerContent) => {
      // Skip if content contains JSX expressions (dynamic content)
      if (innerContent.includes('{') || innerContent.includes('<')) {
        return match;
      }
      
      // Clean up the inner content and capitalize
      const cleanContent = innerContent.trim();
      const capitalizedContent = capitalizeHeading(cleanContent);
      
      if (cleanContent !== capitalizedContent) {
        updated = true;
        console.log(`Updated in ${filePath}: "${cleanContent}" → "${capitalizedContent}"`);
      }
      
      return match.replace(innerContent, capitalizedContent);
    });

    // Also handle headings in CardTitle, which are often headings
    const cardTitleRegex = /<CardTitle[^>]*>([\s\S]*?)<\/CardTitle>/gi;
    content = content.replace(cardTitleRegex, (match, innerContent) => {
      // Skip if content contains JSX expressions
      if (innerContent.includes('{') || innerContent.includes('<')) {
        return match;
      }
      
      const cleanContent = innerContent.trim();
      const capitalizedContent = capitalizeHeading(cleanContent);
      
      if (cleanContent !== capitalizedContent) {
        updated = true;
        console.log(`Updated CardTitle in ${filePath}: "${cleanContent}" → "${capitalizedContent}"`);
      }
      
      return match.replace(innerContent, capitalizedContent);
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated file: ${filePath}`);
    }

    return updated;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findAndUpdateAllHeadings(dir) {
  let totalUpdated = 0;
  
  function processDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        processDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const updated = updateHeadingsInFile(filePath);
        if (updated) totalUpdated++;
      }
    }
  }
  
  processDirectory(dir);
  console.log(`\n🎉 Total files updated: ${totalUpdated}`);
}

// Start processing from app directory
findAndUpdateAllHeadings('./app');
findAndUpdateAllHeadings('./components');
