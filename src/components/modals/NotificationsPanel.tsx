import { X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface PendingFeedback {
  id: string;
  transactionId: string;
  counterpartyAddress: string;
  counterpartyName?: string;
  tradeDate: number;
  status: 'pending' | 'submitted';
  offerorRole: 'buyer' | 'seller';
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pendingFeedbacks: PendingFeedback[];
  onSubmitFeedback: (feedbackId: string) => void;
  currentUserAddress: string;
  isLoading?: boolean;
}

export function NotificationsPanel({
  isOpen,
  onClose,
  pendingFeedbacks,
  onSubmitFeedback,
  currentUserAddress,
  isLoading = false
}: NotificationsPanelProps) {
  if (!isOpen) return null;

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const pendingCount = pendingFeedbacks.filter(f => f.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="bg-white w-full max-w-md max-h-screen shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {pendingCount > 0 && (
              <p className="text-sm text-blue-600 mt-1">{pendingCount} pending actions</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : pendingFeedbacks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <p className="text-gray-600">All caught up!</p>
              <p className="text-sm text-gray-500 mt-2">No pending notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingFeedbacks.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-gray-50 transition">
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {notification.status === 'pending' ? (
                        <>
                          <Clock size={18} className="text-orange-500" />
                          <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded">
                            Pending Feedback
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} className="text-green-500" />
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                            Submitted
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">
                      {notification.offerorRole === 'buyer'
                        ? 'You purchased from:'
                        : 'You sold to:'}
                    </p>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      {shortAddress(notification.counterpartyAddress)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Trade Date: {formatDate(notification.tradeDate)}
                    </p>
                  </div>

                  {/* Action Button */}
                  {notification.status === 'pending' && (
                    <button
                      onClick={() => onSubmitFeedback(notification.id)}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                      Leave Feedback
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
