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
config.port = process.env.ACTUAL_PORT || process.env.PORT || config.port;
config.hostname = process.env.ACTUAL_HOSTNAME || config.hostname;
config.serverFiles = process.env.ACTUAL_SERVER_FILES || config.serverFiles;
config.userFiles = process.env.ACTUAL_USER_FILES || config.userFiles;
config.webRoot = process.env.ACTUAL_WEB_ROOT || config.webRoot;
if (process.env.ACTUAL_HTTPS_KEY && process.env.ACTUAL_HTTPS_CERT) {
  config.https = {
    key: process.env.ACTUAL_HTTPS_KEY,
    cert: process.env.ACTUAL_HTTPS_CERT
  };
}

module.exports = config;
