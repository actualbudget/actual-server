const fs = require('fs');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const static = require('@fastify/static');
const config = require('./load-config');

const accountApp = require('./app-account');
const syncApp = require('./app-sync');

process.on('unhandledRejection', (reason) => {
  console.log('Rejection:', reason);
});

const mb = 1024 * 1024;

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  },
  http2: true,
  https: config.https
    ? {
        allowHTTP1: true,
        ...config.https,
        key: fs.readFileSync(config.https.key),
        cert: fs.readFileSync(config.https.cert)
      }
    : null
});

fastify.register(cors);
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string', bodyLimit: 20 * mb },
  (req, /** @type {string} */ payload, done) => {
    try {
      const body = JSON.parse(payload);
      done(null, body);
    } catch (err) {
      err.statusCode = 400;
      done(err);
    }
  }
);
fastify.addContentTypeParser(
  'application/actual-sync',
  { parseAs: 'buffer', bodyLimit: 20 * mb },
  (req, payload, done) => done(null, payload)
);
fastify.addContentTypeParser(
  'application/encrypted-file',
  { parseAs: 'buffer', bodyLimit: 50 * mb },
  (req, payload, done) => done(null, payload)
);

fastify.register(syncApp, { prefix: '/sync' });
fastify.register(accountApp, { prefix: '/account' });

fastify.get('/mode', () => config.mode);

fastify.register(require('./app-health'));

// The web frontend
fastify.addHook('onRequest', (req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
fastify.register(static, {
  root: __dirname + '/node_modules/@actual-app/web/build',
  index: false
});
fastify.setNotFoundHandler((req, res) => {
  res.sendFile('index.html');
});

async function run() {
  if (!fs.existsSync(config.serverFiles)) {
    fs.mkdirSync(config.serverFiles);
  }

  if (!fs.existsSync(config.userFiles)) {
    fs.mkdirSync(config.userFiles);
  }

  console.log('Listening on ' + config.hostname + ':' + config.port + '...');
  await fastify.listen({
    port: config.port,
    host: config.hostname
  });
}

run().catch((err) => {
  console.log('Error starting app:', err);
  process.exit(1);
});
