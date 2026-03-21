import { StartResponseSchema, SubmitOtpResponseSchema } from '@/schemas/api.schemas';
import type { Answer } from '@/types/campaign';

export function createApiError(status: number, message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.name = 'ApiError';
  err.status = status;
  return err;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw createApiError(res.status, json.error_message ?? 'Unknown error');
  }
  return json as T;
}

export const apiClient = {
  /** POST /api/public/start — exchanges OTP for campaign public key + name */
  start: async (serverUrl: string, otp: string) => {
    const raw = await post<unknown>(`${serverUrl}/api/public/start`, { otp });
    return StartResponseSchema.parse(raw);
  },

  /** POST /api/public/submit-otp — blind-signs the message */
  submitOtp: async (serverUrl: string, otp: string, blinded_msg_b64: string) => {
    const raw = await post<unknown>(`${serverUrl}/api/public/submit-otp`, {
      otp,
      blinded_msg_b64,
    });
    return SubmitOtpResponseSchema.parse(raw);
  },

  /** POST /api/public/submit-response — anonymously submits the answers */
  submitResponse: async (
    serverUrl: string,
    campaign_id: string,
    token_b64: string,
    signature_b64: string,
    answers: Answer[],
  ) => {
    return post<{ data: { success: boolean } }>(
      `${serverUrl}/api/public/submit-response`,
      { campaign_id, token_b64, signature_b64, answers },
    );
  },
};
