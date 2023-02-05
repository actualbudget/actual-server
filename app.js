const fs = require('fs');
const express = require('express');
const actuator = require('express-actuator');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./load-config');

const accountApp = require('./app-account');
const syncApp = require('./app-sync');

const app = express();

process.on('unhandledRejection', (reason) => {
  console.log('Rejection:', reason);
});

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.raw({ type: 'application/actual-sync', limit: '20mb' }));
app.use(bodyParser.raw({ type: 'application/encrypted-file', limit: '50mb' }));

app.use('/sync', syncApp.handlers);
app.use('/account', accountApp.handlers);

app.get('/mode', (req, res) => {
  res.send(config.mode);
});

app.use(actuator()); // Provides /health, /metrics, /info

// The web frontend
app.use((req, res, next) => {
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
app.use(express.static(config.webRoot, { index: false }));

let indexHTML = fs.readFileSync(config.webRoot + '/index.html');
app.get('/*', (req, res) => res.send(indexHTML));

async function run() {
  if (!fs.existsSync(config.serverFiles)) {
    fs.mkdirSync(config.serverFiles);
  }

  if (!fs.existsSync(config.userFiles)) {
    fs.mkdirSync(config.userFiles);
  }

  await accountApp.init();
  await syncApp.init();

  if (config.https) {
    const https = require('https');
    const httpsOptions = {
      ...config.https,
      key: config.https.key.startsWith('-----BEGIN')
        ? config.https.key
        : fs.readFileSync(config.https.key),
      cert: config.https.cert.startsWith('-----BEGIN')
        ? config.https.cert
        : fs.readFileSync(config.https.cert)
    };
    https.createServer(httpsOptions, app).listen(config.port, config.hostname);
  } else {
    app.listen(config.port, config.hostname);
  }
  console.log('Listening on ' + config.hostname + ':' + config.port + '...');
}

run().catch((err) => {
  console.log('Error starting app:', err);
  process.exit(1);
});
