const fs = require('fs');
const path = require('path');

const zoneJsSetup = `import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize TestBed before anything else
const testBed = getTestBed();
try {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch (e) {
  // Already initialized, that's fine
}

`;

function findSpecFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(file)) {
        results = results.concat(findSpecFiles(filePath));
      }
    } else if (file.endsWith('.spec.ts')) {
      results.push(filePath);
    }
  }

  return results;
}

const specFiles = findSpecFiles(path.join(__dirname, 'src'));
let updatedCount = 0;

for (const filePath of specFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already has zone.js import
    if (content.includes("import 'zone.js'")) {
      console.log(`✓ Already updated: ${filePath}`);
      continue;
    }

    // Find the first non-comment, non-empty line that looks like an import
    const lines = content.split('\n');
    let firstImportIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
        firstImportIndex = i;
        break;
      }
    }

    // Inject setup at the beginning (before first import)
    const newContent = zoneJsSetup + content;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    updatedCount++;
    console.log(`✓ Updated: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error.message);
  }
}

console.log(`\n✓ Successfully updated ${updatedCount} spec files`);
