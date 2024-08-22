

export interface HttpClient {
  request(url: string, options: any): Promise<string>;
}

import https from 'https';
import { GenericSimplefinError } from './errors.js';


export class HttpsClient implements HttpClient {
  request(url: string, options: https.RequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request(new URL(url), options, (response) => {
        // reject on bad status
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new GenericSimplefinError('statusCode=' + response.statusCode));
        }
        let data = '';
        response.on('data', (d: Buffer) => { data += d.toString(); });
        response.on('end', () => { resolve(data); });
      });
      req.on('error', (e: Error) => {
        reject(new GenericSimplefinError(e.message));
      });
      req.end();
    });
  }
}