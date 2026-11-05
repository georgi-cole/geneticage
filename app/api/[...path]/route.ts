import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { handleAccountApi } from '../../../lib/account-api.mjs';

export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  return handleAccountApi(request, env, await getChatGPTUser());
}
export { handle as GET, handle as POST, handle as DELETE, handle as PUT, handle as PATCH };
