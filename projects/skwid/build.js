const fs = require('fs');

const package = JSON.parse(fs.readFileSync('package.json').toString());
package.main = 'index.js';
package.bin.skwid = 'cli.js';

fs.writeFileSync('dist/package.json', JSON.stringify(package, null, 2));
fs.writeFileSync('dist/skwid.schema.json', fs.readFileSync('src/skwid.schema.json'));