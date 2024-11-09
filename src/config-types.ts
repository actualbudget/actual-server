import { ServerOptions } from 'https';

type LoginMethod = 'password' | 'header';

export interface Config {
  mode: 'test' | 'development';
  loginMethod: LoginMethod;
  allowedLoginMethods: LoginMethod[];
  trustedProxies: string[];
  trustedAuthProxies?: string[];
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
}
