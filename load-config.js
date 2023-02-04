let userConfig;
let fs = require('fs');
let { join } = require('path');
let root = fs.existsSync('/data') ? '/data' : __dirname;

try {
  // @ts-expect-error TS2307: we expect this file may not exist
  userConfig = require('./config');
} catch (e) {
  // do nothing
}

/** @type {Omit<import('./config-types').Config, 'mode'>} */
let defaultConfig = {
  port: 5006,
  hostname: '::',
  serverFiles: join(root, 'server-files'),
  userFiles: join(root, 'user-files'),
  webRoot: join(__dirname, 'node_modules', '@actual-app', 'web', 'build')
};

/** @type {import('./config-types').Config} */
let config;
if (process.env.NODE_ENV === 'test') {
  config = {
    mode: 'test',
    ...defaultConfig
  };
} else {
  config = {
    mode: 'development',
    ...defaultConfig,
    ...userConfig
  };
}

module.exports = {
  ...config,
  port: +process.env.ACTUAL_PORT || +process.env.PORT || config.port,
  hostname: process.env.ACTUAL_HOSTNAME || config.hostname,
  serverFiles: process.env.ACTUAL_SERVER_FILES || config.serverFiles,
  userFiles: process.env.ACTUAL_USER_FILES || config.userFiles,
  webRoot: process.env.ACTUAL_WEB_ROOT || config.webRoot,
  https:
    process.env.ACTUAL_HTTPS_KEY && process.env.ACTUAL_HTTPS_CERT
      ? {
          key: process.env.ACTUAL_HTTPS_KEY,
          cert: process.env.ACTUAL_HTTPS_CERT,
          ...config.https
        }
      : config.https
};
