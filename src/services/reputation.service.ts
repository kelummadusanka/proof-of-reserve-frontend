import { ApiPromise } from '@polkadot/api';
import { ReputationScore, UIReputationScore } from '../types';

const TRUST_LEVELS = {
  UNPROVEN: { min: 0, max: 2000, label: 'unproven' as const },
  RISKY: { min: 2000, max: 4000, label: 'risky' as const },
  NEUTRAL: { min: 4000, max: 6000, label: 'neutral' as const },
  GOOD: { min: 6000, max: 8000, label: 'good' as const },
  EXCELLENT: { min: 8000, max: 10000, label: 'excellent' as const }
};

export const getReputationScore = async (
  api: ApiPromise,
  accountId: string
): Promise<UIReputationScore | null> => {
  try {
    const score = await api.query.reputation.reputationScores(accountId);

    if (score.isNone) {
      return null;
    }

    const scoreData = score.unwrap();
    const overall = scoreData.overallScore.toNumber();
    const successfulTx = scoreData.successfulTransactions.toNumber();
    const failedTx = scoreData.failedTransactions.toNumber();
    const reliability =
      successfulTx + failedTx > 0
        ? (successfulTx / (successfulTx + failedTx)) * 100
        : 0;
    const avgRating =
      scoreData.totalFeedback > 0
        ? scoreData.feedbackComponent.toNumber() / scoreData.totalFeedback.toNumber()
        : 0;

    // Determine trust level
    let trustLevel: UIReputationScore['trustLevel'] = 'unproven';
    if (overall >= TRUST_LEVELS.EXCELLENT.min)
      trustLevel = TRUST_LEVELS.EXCELLENT.label;
    else if (overall >= TRUST_LEVELS.GOOD.min)
      trustLevel = TRUST_LEVELS.GOOD.label;
    else if (overall >= TRUST_LEVELS.NEUTRAL.min)
      trustLevel = TRUST_LEVELS.NEUTRAL.label;
    else if (overall >= TRUST_LEVELS.RISKY.min)
      trustLevel = TRUST_LEVELS.RISKY.label;

    return {
      overallScore: overall,
      trustLevel,
      successfulTransactions: successfulTx,
      failedTransactions: failedTx,
      reliability,
      averageRating: avgRating,
      totalFeedback: scoreData.totalFeedback.toNumber()
    };
  } catch (error) {
    console.error('Error fetching reputation score:', error);
    return null;
  }
};

export const submitFeedback = async (
  api: ApiPromise,
  signer: any,
  fromAddress: string,
  targetAddress: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await api.tx.reputation
      .submitFeedback(targetAddress, rating, comment)
      .signAndSend(fromAddress, { signer });

    return {
      success: true,
      message: 'Feedback submitted successfully'
    };
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit feedback'
    };
  }
};

// Feedback History Management (using localStorage)
export interface FeedbackItem {
  id: string;
  from: string;
  to: string;
  rating: number;
  comment: string;
  timestamp: number;
  transactionId: string;
  status: 'received' | 'given';
}

export interface PendingFeedback {
  id: string;
  transactionId: string;
  counterpartyAddress: string;
  tradeDate: number;
  status: 'pending' | 'submitted';
  offerorRole: 'buyer' | 'seller';
}

const FEEDBACK_STORAGE_KEY = 'barter_feedback_history';
const PENDING_FEEDBACK_KEY = 'barter_pending_feedback';

export const saveFeedback = (feedback: FeedbackItem): void => {
  try {
    const existing = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
    existing.push(feedback);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving feedback:', error);
  }
};

export const getFeedbackHistory = (): FeedbackItem[] => {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error loading feedback history:', error);
    return [];
  }
};

export const savePendingFeedback = (pending: PendingFeedback): void => {
  try {
    const existing = JSON.parse(localStorage.getItem(PENDING_FEEDBACK_KEY) || '[]');
    const filtered = existing.filter((p: PendingFeedback) => p.id !== pending.id);
    filtered.push(pending);
    localStorage.setItem(PENDING_FEEDBACK_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error saving pending feedback:', error);
  }
};

export const getPendingFeedback = (): PendingFeedback[] => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_FEEDBACK_KEY) || '[]');
  } catch (error) {
    console.error('Error loading pending feedback:', error);
    return [];
  }
};

export const markFeedbackAsSubmitted = (feedbackId: string): void => {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_FEEDBACK_KEY) || '[]');
    const updated = pending.map((p: PendingFeedback) =>
      p.id === feedbackId ? { ...p, status: 'submitted' as const } : p
    );
    localStorage.setItem(PENDING_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating pending feedback:', error);
  }
};

