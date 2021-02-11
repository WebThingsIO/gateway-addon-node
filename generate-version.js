const fs = require('fs');
const pkg = require('./package.json');

fs.writeFileSync('./src/version.ts', `export default '${pkg.version}';\n`);
