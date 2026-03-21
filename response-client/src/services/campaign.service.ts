import { apiClient } from '@/services/api.client';
import { blindToken, finalizeBlindRSA, computeSecurityHash } from '@/services/crypto.service';
import { campaignStore } from '@/services/campaign.store';
import type { Campaign, Answer } from '@/types/campaign';

function parseServerUrl(accessUrl: string): { serverUrl: string; otp: string } {
  const parsed = new URL(accessUrl);
  const otp = parsed.searchParams.get('otp') ?? '';
  // serverUrl = everything except the path (/start) and query string
  const serverUrl = `${parsed.protocol}//${parsed.host}`;
  return { serverUrl, otp };
}

/**
 * Full register flow:
 *  /start → blind() → /submit-otp → finalize() → verify → store
 */
export async function registerCampaign(
  accessUrl: string,
  onStep?: (step: number) => void,
): Promise<Campaign> {
  const { serverUrl, otp } = parseServerUrl(accessUrl);

  // Step 0 — call /start
  onStep?.(0);
  const startRes = await apiClient.start(serverUrl, otp);
  const { campaign_name, public_key_spki, question_payload } = startRes.data;

  // Step 1 — blind the token
  onStep?.(1);
  const { preparedMsg, inv, blindedMsg_b64 } = await blindToken(public_key_spki);

  // Step 2 — /submit-otp (server blind-signs)
  onStep?.(2);
  const otpRes = await apiClient.submitOtp(serverUrl, otp, blindedMsg_b64);
  const { blind_signature_b64, campaign_id } = otpRes.data;

  // Step 3 — finalize (unblind + verify)
  onStep?.(3);
  const { token_b64, signature_b64 } = await finalizeBlindRSA(
    public_key_spki,
    preparedMsg,
    inv,
    blind_signature_b64,
  );

  // Step 4 — compute security hash + parse questions
  onStep?.(4);
  const securityHash = await computeSecurityHash(public_key_spki, question_payload);
  const parsedPayload = JSON.parse(question_payload) as {
    campaign_id: string;
    campaign_name: string;
    questions: Campaign['questions'];
  };

  const campaign: Campaign = {
    id: crypto.randomUUID(),
    serverId: campaign_id,
    serverUrl,
    name: campaign_name || parsedPayload.campaign_name,
    questions: parsedPayload.questions,
    publicKeySPKI: public_key_spki,
    questionPayload: question_payload,
    securityHash,
    status: 'pending',
    addedAt: new Date().toISOString(),
  };

  // Persist
  campaignStore.saveCampaign(campaign);
  campaignStore.saveTokenData(campaign.id, token_b64, signature_b64);

  return campaign;
}

/**
 * Submit the user's answers anonymously to the backend.
 */
export async function submitResponse(
  campaignId: string,
  answers: Answer[],
  formValues: Record<string, unknown>,
): Promise<void> {
  const campaign = campaignStore.getCampaignById(campaignId);
  if (!campaign) throw new Error('Campaign not found in local store');

  const { token_b64, sig_b64 } = campaignStore.getTokenData(campaignId);
  if (!token_b64 || !sig_b64) throw new Error('Token or signature missing — cannot submit');

  await apiClient.submitResponse(
    campaign.serverUrl,
    campaign.serverId,
    token_b64,
    sig_b64,
    answers,
  );

  campaignStore.markSubmitted(campaignId, formValues);
  campaignStore.clearDraftAnswers(campaignId);
}
