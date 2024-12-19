export type CompetitionLevel = 'Low' | 'Medium' | 'High';

interface CompetitionInfo {
  level: CompetitionLevel;
  description: string;
  color: string;
}

export function getCompetitionInfo(competitionValue: number | null): CompetitionInfo {
  if (competitionValue === null) {
    return {
      level: 'Medium',
      description: 'Medium competition (default)',
      color: 'text-yellow-600'
    };
  }

  if (competitionValue < 0.33) {
    return {
      level: 'Low',
      description: 'Low competition (easy to rank)',
      color: 'text-green-600'
    };
  }

  if (competitionValue < 0.66) {
    return {
      level: 'Medium',
      description: 'Medium competition (moderate effort needed)',
      color: 'text-yellow-600'
    };
  }

  return {
    level: 'High',
    description: 'High competition (significant effort needed)',
    color: 'text-red-600'
  };
}

// Usage example:
// const { level, description, color } = getCompetitionInfo(0.45);
