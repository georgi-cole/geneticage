import { env } from 'cloudflare:workers';
import { handleAccountApi } from '../../../lib/account-api.mjs';
import { getEmailUser, handleEmailAuthApi } from '../../../lib/email-auth.mjs';

export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  const auth = await handleEmailAuthApi(request, env);
  return auth ?? handleAccountApi(request, env, await getEmailUser(request, env));
}
export { handle as GET, handle as POST, handle as DELETE, handle as PUT, handle as PATCH };
