import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createDebug from 'debug';

const debug = createDebug('actual:config');
const debugSensitive = createDebug('actual-sensitive:config');

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
debug(`project root: '${projectRoot}'`);
export const sqlDir = path.join(projectRoot, 'src', 'sql');

let defaultDataDir = fs.existsSync('/data') ? '/data' : projectRoot;
debug(`default data directory: '${defaultDataDir}'`);

function parseJSON(path, allowMissing = false) {
  let text;
  try {
    text = fs.readFileSync(path, 'utf8');
  } catch (e) {
    if (allowMissing) {
      debug(`config file '${path}' not found, ignoring.`);
      return {};
    }
    throw e;
  }
  return JSON.parse(text);
}

let userConfig;
if (process.env.ACTUAL_CONFIG_PATH) {
  debug(
    `loading config from ACTUAL_CONFIG_PATH: '${process.env.ACTUAL_CONFIG_PATH}'`,
  );
  userConfig = parseJSON(process.env.ACTUAL_CONFIG_PATH);
} else {
  debug(`loading config from default path: '${defaultDataDir}/config.json'`);
  userConfig = parseJSON(path.join(defaultDataDir, 'config.json'), true);
}

/** @type {Omit<import('./config-types.js').Config, 'mode' | 'serverFiles' | 'userFiles'>} */
let defaultConfig = {
  port: 5006,
  hostname: '::',
  webRoot: path.join(
    projectRoot,
    'node_modules',
    '@actual-app',
    'web',
    'build',
  ),
};

/** @type {import('./config-types.js').Config} */
let config;
if (process.env.NODE_ENV === 'test') {
  config = {
    mode: 'test',
    serverFiles: path.join(projectRoot, 'test-server-files'),
    userFiles: path.join(projectRoot, 'test-user-files'),
    ...defaultConfig,
  };
} else {
  config = {
    mode: 'development',
    ...defaultConfig,
    serverFiles: path.join(defaultDataDir, 'server-files'),
    userFiles: path.join(defaultDataDir, 'user-files'),
    ...(userConfig || {}),
  };
}

const config = {
  ...config,
  port: +process.env.ACTUAL_PORT || +process.env.PORT || config.port,
  hostname: process.env.ACTUAL_HOSTNAME || config.hostname,
  serverFiles: process.env.ACTUAL_SERVER_FILES || config.serverFiles,
  userFiles: process.env.ACTUAL_USER_FILES || config.userFiles,
  webRoot: process.env.ACTUAL_WEB_ROOT || config.webRoot,
  https:
    process.env.ACTUAL_HTTPS_KEY && process.env.ACTUAL_HTTPS_CERT
      ? {
          key: process.env.ACTUAL_HTTPS_KEY.replace(/\\n/g, '\n'),
          cert: process.env.ACTUAL_HTTPS_CERT.replace(/\\n/g, '\n'),
          ...(config.https || {}),
        }
      : config.https,
  nordigen:
    process.env.ACTUAL_NORDIGEN_SECRET_ID &&
    process.env.ACTUAL_NORDIGEN_SECRET_KEY
      ? {
          secretId: process.env.ACTUAL_NORDIGEN_SECRET_ID,
          secretKey: process.env.ACTUAL_NORDIGEN_SECRET_KEY,
          ...(config.nordigen || {}),
        }
      : config.nordigen,
};

debug(`using port ${config.port}`);
debug(`using hostname ${config.hostname}`);
debug(`using server files directory ${config.serverFiles}`);
debug(`using user files directory ${config.userFiles}`);
debug(`using web root directory ${config.webRoot}`);

if (config.https) {
  debug(`using https key: ${'*'.repeat(config.https.key.length)}`);
  debugSensitive(`using https key ${config.https.key}`);
  debug(`using https cert: ${'*'.repeat(config.https.cert.length)}`);
  debugSensitive(`using https cert ${config.https.cert}`);
}

if (config.nordigen) {
  debug(
    `using nordigen secret id: ${'*'.repeat(config.nordigen.secretId.length)}`,
  );
  debugSensitive(`using nordigen secret id ${config.nordigen.secretId}`);
  debug(
    `using nordigen secret key: ${'*'.repeat(
      config.nordigen.secretKey.length,
    )}`,
  );
  debugSensitive(`using nordigen secret key ${config.nordigen.secretKey}`);
}

export default config;
