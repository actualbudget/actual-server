import { getSession } from '../account-db.js';
import config from '../load-config.js';
import proxyaddr from "proxy-addr"
import ipaddr from "ipaddr.js"

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
  if (config.trustedProxy.length == 0) {
    return true;
  }

  let sender = proxyaddr(req, "uniquelocal");
  let sender_ip = ipaddr.parse(sender);
  const rangeList = {
    allowed_ips: config.trustedProxy.map(q => ipaddr.parseCIDR(q))
  };
  // @ts-ignore
  var matched = ipaddr.subnetMatch(sender_ip, rangeList, "fail")
  return matched == "allowed_ips"
}