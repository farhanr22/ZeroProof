import type { Campaign } from '@/types/campaign';

const CAMPAIGNS_KEY = 'campaigns';
const draftKey = (id: string) => `campaign_${id}_draft`;
const tokenKey = (id: string) => `campaign_${id}_token`;
const sigKey = (id: string) => `campaign_${id}_sig`;

export const campaignStore = {
  // ── Campaign list ──────────────────────────────────────────────

  getCampaigns(): Campaign[] {
    try {
      const stored = localStorage.getItem(CAMPAIGNS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getCampaignById(id: string): Campaign | undefined {
    return this.getCampaigns().find((c) => c.id === id);
  },

  saveCampaign(campaign: Campaign): void {
    const campaigns = this.getCampaigns();
    const idx = campaigns.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) {
      campaigns[idx] = campaign;
    } else {
      campaigns.unshift(campaign);
    }
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  },

  deleteCampaign(id: string): void {
    const campaigns = this.getCampaigns().filter((c) => c.id !== id);
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
    localStorage.removeItem(tokenKey(id));
    localStorage.removeItem(sigKey(id));
    localStorage.removeItem(draftKey(id));
  },

  markSubmitted(id: string, finalAnswers: Record<string, unknown>): void {
    const campaigns = this.getCampaigns();
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx >= 0) {
      campaigns[idx].status = 'submitted';
      campaigns[idx].submittedAnswers = finalAnswers;
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
    }
  },

  // ── Token / Signature (spec keys) ─────────────────────────────

  saveTokenData(id: string, token_b64: string, sig_b64: string): void {
    localStorage.setItem(tokenKey(id), token_b64);
    localStorage.setItem(sigKey(id), sig_b64);
  },

  getTokenData(id: string): { token_b64: string | null; sig_b64: string | null } {
    return {
      token_b64: localStorage.getItem(tokenKey(id)),
      sig_b64: localStorage.getItem(sigKey(id)),
    };
  },

  // ── Draft answers ──────────────────────────────────────────────

  saveDraftAnswers(id: string, answers: Record<string, unknown>): void {
    localStorage.setItem(draftKey(id), JSON.stringify(answers));
  },

  getDraftAnswers(id: string): Record<string, unknown> | null {
    try {
      const stored = localStorage.getItem(draftKey(id));
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  clearDraftAnswers(id: string): void {
    localStorage.removeItem(draftKey(id));
  },
};
