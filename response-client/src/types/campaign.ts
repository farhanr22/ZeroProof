// Maps to the backend question schema
export interface Question {
  _id: string;
  order: number;
  type: 'single_choice' | 'multi_choice' | 'rating' | 'text';
  text: string;
  options: string[]; // empty for rating/text
}

// Frontend-local campaign representation
// id is frontend-generated (crypto.randomUUID), NOT the backend's campaign_id
export interface Campaign {
  id: string;           // frontend UUID - used for routing and localStorage keys
  serverId: string;     // backend's campaign_id - used only when submitting response
  serverUrl: string;    // base URL of the backend (e.g. http://localhost:3000)
  name: string;
  questions: Question[];
  publicKeySPKI: string; // base64 SPKI
  questionPayload: string; // raw canonical JSON from backend
  securityHash: string;   // SHA-256(spki + questionPayload) hex - used for jdenticon
  status: 'pending' | 'submitted';
  submittedAnswers?: Record<string, unknown>; // final locked-in answers
  addedAt: string; // ISO date string
}

// Answer shape for submission
export interface Answer {
  question_id: string;
  type: 'single_choice' | 'multi_choice' | 'rating' | 'text';
  value: string | string[] | number | number[];
}
