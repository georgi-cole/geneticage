import { env } from 'cloudflare:workers';
import { handleAccountApi } from '../../../lib/account-api.mjs';
import { getEmailUser, handleEmailAuthApi } from '../../../lib/email-auth.mjs';
type ReportContent = Parameters<typeof import('../../../lib/report-pdf.mjs').renderFullReportPdf>[0];
async function renderPdf(content: ReportContent, language: string) {
  const [{renderFullReportPdf},{default:font}] = await Promise.all([
    import('../../../lib/report-pdf.mjs'),
    import('../../../public/assets/fonts/manrope-report.ttf?inline'),
  ]);
  const fontBytes = Uint8Array.from(atob(font.split(',')[1]), char => char.charCodeAt(0));
  return renderFullReportPdf(content, {language,fontBytes});
}

export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  const auth = await handleEmailAuthApi(request, env);
  return auth ?? handleAccountApi(request, env, await getEmailUser(request, env), {renderPdf});
}
export { handle as GET, handle as POST, handle as DELETE, handle as PUT, handle as PATCH };
