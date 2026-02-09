const fs = require('fs');
const path = require('path');

const originalPath = path.join('src', 'utils', 'printUtils.js');
const fragmentPath = path.join('src', 'utils', 'printUtils_fragment.js');

try {
    const originalContent = fs.readFileSync(originalPath, 'utf8');
    // Using regex to handle different newline styles if necessary, but split('\n') is usually fine for text processing if we join with \n
    const lines = originalContent.split(/\r?\n/);

    // We want to keep lines 0 to 715 (0-indexed). 
    // Line 716 in 1-based index is line 715 in 0-based.
    // The previous tool check showed line 716 was "};" and line 717 was "e x p o r t ..."
    // So we slice(0, 716), which gives us 0..715.
    const newLines = lines.slice(0, 716);

    const fragmentContent = fs.readFileSync(fragmentPath, 'utf8');

    const finalContent = newLines.join('\n') + '\n\n' + fragmentContent;

    fs.writeFileSync(originalPath, finalContent, 'utf8');
    console.log('Successfully fixed printUtils.js');
} catch (err) {
    console.error('Error fixing file:', err);
    process.exit(1);
}
