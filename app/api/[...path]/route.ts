import { env } from 'cloudflare:workers';
import { handleAccountApi } from '../../../lib/account-api.mjs';
import { getSessionUser, handleAuthApi } from '../../../lib/auth-api.mjs';

export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  const auth = await handleAuthApi(request, env);
  return auth ?? handleAccountApi(request, env, await getSessionUser(request, env));
}
export { handle as GET, handle as POST, handle as DELETE, handle as PUT, handle as PATCH };
