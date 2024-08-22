export interface CustomRequestOptions {
  headers?: { [key: string]: string };
  port: number;
  method: string;
}

export interface HttpClient {
  request(url: string, options: CustomRequestOptions): Promise<string>;
}

import https from 'https';

export class HttpsClient implements HttpClient {
  request(url: string, options: CustomRequestOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request(new URL(url), options, (response) => {
        // reject on bad status
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(
            new Error(`${response.statusCode} ${response.statusMessage}`),
          );
        }
        let data = '';
        response.on('data', (d: Buffer) => {
          data += d.toString();
        });
        response.on('end', () => {
          resolve(data);
        });
      });
      req.on('error', (e: Error) => {
        reject(e);
      });
      req.end();
    });
  }
}
