import React from 'react';

interface ConfidenceIndicatorProps {
  score: number;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ score }) => {
  const getColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Confidence: {Math.round(score * 100)}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${getColor(score)}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceIndicator;
