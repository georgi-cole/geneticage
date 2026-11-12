declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ASSESSMENT_ENCRYPTION_KEY?: string;
    RESEND_API_KEY?: string;
    AUTH_EMAIL_FROM?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    APPLE_SERVICES_ID?: string;
    APPLE_TEAM_ID?: string;
    APPLE_KEY_ID?: string;
    APPLE_PRIVATE_KEY?: string;
    PAYMENTS_ENABLED?: string;
    PAYMENT_WEBHOOK_READY?: string;
    PUBLIC_SITE_ORIGIN?: string;
    STRIPE_MODE?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_REPORT_PRICE_ID?: string;
    STRIPE_AUTOMATIC_TAX?: string;
    REPORT_REVIEW_MODE?: string;
  }
}
