import { useState } from 'react';
import { Star, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  counterpartyAddress: string;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
  isLoading?: boolean;
}

export function FeedbackModal({
  isOpen,
  counterpartyAddress,
  onClose,
  onSubmit,
  isLoading = false
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(rating, feedback);
    setRating(0);
    setFeedback('');
  };

  const handleSkip = () => {
    setRating(0);
    setFeedback('');
    onClose();
  };

  const shortAddress = `${counterpartyAddress.slice(0, 6)}...${counterpartyAddress.slice(-6)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-in fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Rate Your Trade</h2>
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Counterparty Info */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Trade Partner</p>
          <p className="text-sm font-mono text-blue-600">{shortAddress}</p>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            How was your experience?
          </p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={isLoading}
                className="disabled:opacity-50 transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-sm text-gray-600">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </p>
          )}
        </div>

        {/* Feedback Text */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
            disabled={isLoading}
            placeholder="Share your experience with this trade partner..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 text-gray-900 placeholder-gray-400"
            rows={3}
          />
          <p className="text-xs text-gray-600 mt-1">
            {feedback.length}/500 characters
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium transition"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
