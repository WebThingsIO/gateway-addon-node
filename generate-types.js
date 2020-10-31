// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {compileFromFile} = require('json-schema-to-typescript');

compileFromFile('schema/messages/plugin-register-response.json')
  .then((ts) => fs.writeFileSync('src/plugin-register-response.d.ts', ts));
