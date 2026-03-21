export interface FeedbackDraft {
  id: string;
  campaignId: string;
  data: any;
  submittedAt: string;
  status: 'pending' | 'submitted';
}

const STORAGE_KEY = 'feedback_drafts';

export const draftService = {
  getDrafts: (): FeedbackDraft[] => {
    try {
      if (typeof window === 'undefined') return [];
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((d: any) => ({
        ...d,
        status: d.status || 'submitted'
      }));
    } catch (e) {
      console.error('Failed to parse drafts from local storage', e);
      return [];
    }
  },

  getDraftByCampaignAndStatus: (campaignId: string, status: 'pending' | 'submitted'): FeedbackDraft | undefined => {
    return draftService.getDrafts().find(d => d.campaignId === campaignId && d.status === status);
  },

  saveDraft: (campaignId: string, data: any, status: 'pending' | 'submitted' = 'submitted') => {
    const drafts = draftService.getDrafts();
    
    const existingIndex = drafts.findIndex(d => d.campaignId === campaignId && d.status === 'pending');

    if (existingIndex >= 0) {
      drafts[existingIndex].data = data;
      drafts[existingIndex].status = status;
      drafts[existingIndex].submittedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      return drafts[existingIndex];
    }

    const newDraft: FeedbackDraft = {
      id: crypto.randomUUID(),
      campaignId,
      data,
      submittedAt: new Date().toISOString(),
      status
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newDraft, ...drafts]));
    return newDraft;
  },

  getDraftsByCampaign: (campaignId: string): FeedbackDraft[] => {
    return draftService.getDrafts().filter(d => d.campaignId === campaignId);
  },

  clearDrafts: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }
};
