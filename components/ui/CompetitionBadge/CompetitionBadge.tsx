import { getCompetitionInfo } from './getCompetitionInto';

interface CompetitionBadgeProps {
  value: number | null;
  showDescription?: boolean;
}

export default function CompetitionBadge({ value, showDescription = false }: CompetitionBadgeProps) {
  const { level, description, color } = getCompetitionInfo(value);
  
  return (
    <div className="flex items-center justify-center gap-2">
      <span className={`font-medium ${color}`}>
        {level}
      </span>
      {showDescription && (
        <span className="text-gray-600 text-sm">
          {description}
        </span>
      )}
    </div>
  );
}
