const fs = require('fs');

const package = JSON.parse(fs.readFileSync('package.json').toString());
package.main = 'index.js';
package.typings = 'index.d.ts';

fs.writeFileSync('dist/package.json', JSON.stringify(package, null, 2));