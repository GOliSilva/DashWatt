const fs = require('fs');
const path = require('path');

const root = process.cwd();
const swSrc = path.join(root, 'public', 'sw.js');
const swDest = path.join(root, '.next', 'sw.js');
const headersSrc = path.join(root, 'public', '_headers');
const headersDest = path.join(root, '.next', '_headers');

const copyIfExists = (src, dest) => {
  if (!fs.existsSync(src)) {
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
};

copyIfExists(swSrc, swDest);
copyIfExists(headersSrc, headersDest);
