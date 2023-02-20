export interface Config {
  mode: 'test' | 'development';
  port: number;
  hostname: string;
  serverFiles: string;
  userFiles: string;
  webRoot: string;
  https?: {
    key: string;
    cert: string;
  } & Parameters<typeof import('node:https')['createServer']>[0];
  nordigen_secret_id?: string;
  nordigen_secret_key?: string;
}
