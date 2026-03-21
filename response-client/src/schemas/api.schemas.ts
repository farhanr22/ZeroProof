import { z } from 'zod';

// Validates the response from POST /api/public/start
export const StartResponseSchema = z.object({
  data: z.object({
    campaign_name: z.string(),
    public_key_spki: z.string(),
    question_payload: z.string(), // canonical JSON string
  }),
  error: z.literal(false),
});

// Validates the response from POST /api/public/submit-otp
export const SubmitOtpResponseSchema = z.object({
  data: z.object({
    blind_signature_b64: z.string(),
    campaign_id: z.string(),
  }),
  error: z.literal(false),
});

// Validates access URL format: must be http(s) with /start path and ?otp=...
export const AccessUrlSchema = z.string()
  .url('Must be a valid URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return (
          (parsed.pathname.endsWith('/start') ||
            parsed.pathname.endsWith('/start/')) &&
          parsed.searchParams.has('otp')
        );
      } catch {
        return false;
      }
    },
    { message: 'URL must point to a /start endpoint with ?otp= parameter' }
  );
