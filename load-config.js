let config = {};
let fs = require('fs');
let { join } = require('path');
let root = fs.existsSync('/data') ? '/data' : __dirname;

try {
  // @ts-expect-error TS2307: we expect this file may not exist
  config = require('./config');
} catch (e) {
  // do nothing
}

let defaultConfig = {
  port: 5006,
  hostname: '::',
  serverFiles: join(root, 'server-files'),
  userFiles: join(root, 'user-files'),
  webRoot: join(__dirname, 'node_modules', '@actual-app', 'web', 'build')
};
if (process.env.NODE_ENV === 'test') {
  config = {
    mode: 'test',
    ...defaultConfig
  };
} else {
  config = {
    mode: 'development',
    ...defaultConfig,
    ...config
  };
}

// The env variable always takes precedence
config.userFiles = process.env.ACTUAL_USER_FILES || config.userFiles;

module.exports = config;
