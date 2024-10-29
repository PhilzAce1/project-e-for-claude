import React from 'react';
import { Rankings } from '../../utils/helpers/ranking-data-types';
import generateRankingsSummary from '../../utils/helpers/ranking-summary';

interface CompetitorOverviewProps {
  competitorsRankings: Rankings[];
}

const CompetitorOverview: React.FC<CompetitorOverviewProps> = ({ competitorsRankings }) => {
  const summaries = competitorsRankings.map(rankings => generateRankingsSummary(rankings));

  const totalKeywords = summaries.reduce((sum, summary) => sum + summary.totalKeywords, 0);
  const averageKeywords = Math.round(totalKeywords / summaries.length);
  const totalOpportunities = summaries.reduce((sum, summary) => sum + summary.potentialOpportunities.length, 0);

  return (
        <div className="overflow-hidden bg-white sm:rounded-lg sm:shadow ring-slate-900/10">
        
            <div className='border-b border-gray-20'>
                <h2 className="text-base font-semibold leading-6 text-gray-900 p-6">
                    Summary of {competitorsRankings.length} competitors analyzed
                </h2>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3  p-8 py-8">
            
            <div className="mx-auto flex max-w-xs flex-col ">
                    <dt className="text-base leading-7 text-gray-600">Total Keywords</dt>
                    <dd className=" text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {totalKeywords}
                    </dd>
                </div>
                <div className="mx-auto flex max-w-xs flex-col">
                    <dt className="text-base leading-7 text-gray-600">Average Keywords per Competitor</dt>
                    <dd className=" text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {averageKeywords}
                    </dd>
                </div>
                <div className="mx-auto flex max-w-xs flex-col">
                    <dt className="text-base leading-7 text-gray-600">Total Opportunities</dt>
                    <dd className=" text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        {totalOpportunities}
                    </dd>
                </div>
            </dl>
        </div>
  );
};

export default CompetitorOverview;

