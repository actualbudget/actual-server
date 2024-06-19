import { getSession } from '../account-db.js';
import config from '../load-config.js';
import proxyaddr from 'proxy-addr';
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
  if (config.trustedProxies.length == 0) {
    return true;
  }

  // Retrieve all addresses except the last one
  let proxies = proxyaddr.all(req, 'uniquelocal');
  let client_ip = ipaddr.process(proxies[proxies.length - 1]); // Store client IP for later use
  proxies.pop(); // Remove the last address, which is the client's address

  const rangeList = {
    allowed_ips: config.trustedProxies.map((q) => ipaddr.parseCIDR(q)),
  };

  // Check if all of the proxies are within the trusted range
  for (let proxy of proxies) {
    let proxy_ip = ipaddr.process(proxy);
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore : there is an error in the ts definition for the function, but this is valid
    var matched = ipaddr.subnetMatch(proxy_ip, rangeList, 'fail');
    /* eslint-enable @typescript-eslint/ban-ts-comment */
    if (matched != 'allowed_ips') {
      console.warn(`blocked Header Auth Login attempt from ${proxy_ip}`);
      console.info(`Client IP: ${client_ip}`);
      return false;
    }
  }

  // If all of the proxies matched the allowed IPs
  let proxy_ips = [];
  for (let proxy of proxies) {
    proxy_ips.push(ipaddr.process(proxy));
  }
  console.info(`permitted Header Auth Login from ${proxy_ips.join(', ')}`);
  console.info(`Client IP: ${client_ip}`);
  return true;
}
