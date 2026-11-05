import { env } from 'cloudflare:workers';
import { handleStripeWebhook } from '../../../../lib/payments.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) { return handleStripeWebhook(request, env); }
