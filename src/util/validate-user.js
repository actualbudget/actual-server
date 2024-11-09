import { getSession } from '../account-db.js';
import config from '../load-config.js';
import ipaddr from 'ipaddr.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export default function validateUser(req, res) {
  let { token } = req.body || {};

  if (!token) {
    token = req.headers['x-actual-token'];
  }

  let session = getSession(token);

  if (!session) {
    res.status(401);
    res.send({
      status: 'error',
      reason: 'unauthorized',
      details: 'token-not-found',
    });
    return null;
  }

  return session;
}

export function validateAuthHeader(req) {
  // fallback to trustedProxies when trustedAuthProxies not set
  const trustedAuthProxies = config.trustedAuthProxies ?? config.trustedProxies;
  // ensure the first hop from our server is trusted
  let peer = req.socket.remoteAddress;
  let peerIp = ipaddr.process(peer);
  const rangeList = {
    allowed_ips: trustedAuthProxies.map((q) => ipaddr.parseCIDR(q)),
  };
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore : there is an error in the ts definition for the function, but this is valid
  var matched = ipaddr.subnetMatch(peerIp, rangeList, 'fail');
  /* eslint-enable @typescript-eslint/ban-ts-comment */
  if (matched == 'allowed_ips') {
    console.info(`Header Auth Login permitted from ${peer}`);
    return true;
  } else {
    console.warn(`Header Auth Login attempted from ${peer}`);
    return false;
  }
}
