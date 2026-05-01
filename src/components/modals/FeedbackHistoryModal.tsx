import { useState } from 'react';
import { X, Star, MessageCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface FeedbackItem {
  id: string;
  from: string;
  to: string;
  rating: number;
  comment: string;
  timestamp: number;
  transactionId: string;
  status: 'received' | 'given';
}

interface FeedbackHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackHistory: FeedbackItem[];
  currentUserAddress: string;
  isLoading?: boolean;
}

export function FeedbackHistoryModal({
  isOpen,
  onClose,
  feedbackHistory,
  currentUserAddress,
  isLoading = false
}: FeedbackHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  if (!isOpen) return null;

  const filteredFeedback = feedbackHistory.filter(f => {
    if (activeTab === 'received') {
      return f.to === currentUserAddress;
    } else {
      return f.from === currentUserAddress;
    }
  });

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating <= 3) return 'text-orange-500';
    if (rating <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating] || 'No rating';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Feedback History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-3 px-4 font-medium transition ${
              activeTab === 'received'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Feedback Received
          </button>
          <button
            onClick={() => setActiveTab('given')}
            className={`py-3 px-4 font-medium transition ${
              activeTab === 'given'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Feedback Given
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading feedback...</div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {activeTab} feedback yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((feedback) => (
                <div key={feedback.id} className="p-6 hover:bg-gray-50 transition">
                  {/* User & Rating */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        {activeTab === 'received' ? 'From' : 'To'}:
                      </p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {shortAddress(activeTab === 'received' ? feedback.from : feedback.to)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < feedback.rating
                                ? `fill-yellow-400 text-yellow-400`
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <p className={`text-sm font-semibold ${getRatingColor(feedback.rating)}`}>
                        {getRatingLabel(feedback.rating)}
                      </p>
                    </div>
                  </div>

                  {/* Comment */}
                  {feedback.comment && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{feedback.comment}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500">
                    {formatDate(feedback.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
