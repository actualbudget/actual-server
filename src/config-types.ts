import { ServerOptions } from 'https';

export interface Config {
  mode: 'test' | 'development';
  loginMethod: 'password' | 'header' | 'openid';
  trustedProxies: string[];
  dataDir: string;
  projectRoot: string;
  port: number;
  hostname: string;
  serverFiles: string;
  userFiles: string;
  webRoot: string;
  https?: {
    key: string;
    cert: string;
  } & ServerOptions;
  upload?: {
    fileSizeSyncLimitMB: number;
    syncEncryptedFileSizeLimitMB: number;
    fileSizeLimitMB: number;
  };
  openId?: {
    issuer: string;
    client_id: string;
    client_secret: string;
    server_hostname: string;
  };
  password?: string;
  multiuser: boolean;
}
