import { proxyAuth } from '../src/sync/proxy';

export const config = { runtime: 'edge' };

/** /api/auth/* → Neon Auth (ver src/sync/proxy.ts). */
export default function handler(req: Request): Promise<Response> {
  return proxyAuth(req);
}
