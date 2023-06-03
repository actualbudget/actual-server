export {};

declare global {
  namespace Express {
    export interface Request {
      jti?: string;
    }
  }
}
