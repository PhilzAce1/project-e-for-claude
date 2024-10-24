import React from 'react';
import { Rankings, RankingItem, KeywordData } from '../../utils/helpers/ranking-data-types';
import generateRankingsSummary from '../../utils/helpers/ranking-summary';

interface RankingsSummaryViewProps {
  rankings: Rankings;
}

const RankingsSummaryView: React.FC<RankingsSummaryViewProps> = ({ rankings }) => {
  if (!rankings || !rankings.rankings_data || !rankings.rankings_data.items || rankings.rankings_data.items.length === 0) {
    return (
        <div className="overflow-hidden bg-white sm:rounded-lg sm:shadow">
            <div className='border-b border-gray-200 bg-white px-4 py-5 sm:px-6'>
                <h1 className="text-base font-semibold leading-6 text-gray-900">
                    Performance Summary for {rankings.domain}
                </h1>
                </div>
                <p className=' p-8 text-gray-500 max-w-lg'>Good news! Your competitor does not have any keywords ranking, this is a huge opportunity for you to dominate the search results.</p>
        </div>
    );
  }

  const summary = generateRankingsSummary(rankings);

  return (
    <div className="overflow-hidden bg-white sm:rounded-lg sm:shadow">
        <div className='border-b border-gray-200 bg-white px-4 py-5 sm:px-6'>
            <h3 className="text-base font-semibold leading-6 text-gray-900">Performance Summary for {rankings.domain}</h3>
        </div>

        <OverallMetrics 
          totalKeywords={summary.totalKeywords} 
          totalETV={summary.totalETV} 
          averageBacklinks={summary.averageBacklinks}
        />
        
        <div  className="grid grid-cols-1 gap-y-16 text-center lg:grid-cols-3 mx-8 border-b border-gray-200 pb-8">
        {summary.rankingDistribution && Object.keys(summary.rankingDistribution).length > 0 && (
          <RankingDistribution distribution={summary.rankingDistribution} />
        )}
        
        {summary.keywordDifficultyDistribution && Object.keys(summary.keywordDifficultyDistribution).length > 0 && (
          <KeywordDifficultyDistribution distribution={summary.keywordDifficultyDistribution} />
        )}

        {summary.searchIntentDistribution && Object.keys(summary.searchIntentDistribution).length > 0 && (
          <SearchIntentDistribution distribution={summary.searchIntentDistribution} />
        )}
        </div>
        {summary.topKeywords && summary.topKeywords.length > 0 && (
          <TopKeywords keywords={summary.topKeywords} />
        )}
        
        <div  className="grid grid-cols-1  gap-y-16 text-center lg:grid-cols-2 border-b border-gray-200 pb-8">
        {summary.trendingKeywords && summary.trendingKeywords.length > 0 && (
          <TrendingKeywords keywords={summary.trendingKeywords} />
        )}

        {summary.serpFeatureDistribution && Object.keys(summary.serpFeatureDistribution).length > 0 && (
          <SerpFeatureDistribution distribution={summary.serpFeatureDistribution} />
        )}
        </div>
    </div>
  );
};

// Subcomponents
const OverallMetrics: React.FC<{totalKeywords: number; totalETV: number; averageBacklinks: number}> = 
  ({ totalKeywords, totalETV, averageBacklinks }) => (

<div className=" px-6 lg:px-8">
    <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3 border-b border-gray-200 py-8">
    
    <div className="mx-auto flex max-w-xs flex-col ">
            <dt className="text-base leading-7 text-gray-600">Total Keywords</dt>
            <dd className=" text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {totalKeywords}
            </dd>
        </div>
        <div className="mx-auto flex max-w-xs flex-col">
            <dt className="text-base leading-7 text-gray-600">Total ETV</dt>
            <dd className=" text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                ${totalETV.toFixed(2)}
            </dd>
        </div>
        <div className="mx-auto flex max-w-xs flex-col">
            <dt className="text-base leading-7 text-gray-600">Average Backlinks</dt>
            <dd className=" text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {averageBacklinks.toFixed(2)}
            </dd>
        </div>
    </dl>
</div>
);

const RankingDistribution: React.FC<{distribution: Record<string, number>}> = ({ distribution }) => (
  <div className="ranking-distribution">
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase py-4'>Ranking Distribution</h2>
    </div>
    <table className="divide-y divide-gray-300 text-center m-auto">
    {Object.entries(distribution).map(([range, count]) => (
        <tr key={count} className="even:bg-gray-50">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left"> 
            {range}:
            </td>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-center"> 
            {count}
            </td>
        </tr>
      ))}
    </table>
  </div>
);

const TopKeywords: React.FC<{keywords: Array<{keyword: string; etv: number; rank: number; rankChange: number}>}> = 
  ({ keywords }) => (
  <div className="top-keywords px-6 lg:px-8 pb-8">
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase  py-4'>Top Keywords</h2>
    </div>
    <div className=' px-8'>
      <table className="min-w-full divide-y divide-gray-300 text-center">
        <thead>
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
              Keyword
            </th>
            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
              ETV
            </th>
            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
              Rank
            </th>
            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
      {keywords.map(keyword => (
            <tr key={keyword.keyword} className="even:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">  {keyword.keyword}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${keyword.etv.toFixed(2)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{keyword.rank}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{keyword.rankChange}</td>
            </tr>
      ))}
        </tbody>
    </table>
    </div>
  </div>
);

const KeywordDifficultyDistribution: React.FC<{distribution: Record<string, number>}> = ({ distribution }) => (
  <div className="keyword-difficulty-distribution">
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase  py-4'>Keyword Difficulty Distribution</h2>
    </div>
    <table className="divide-y divide-gray-300 text-center m-auto">
    {Object.entries(distribution).map(([level, count]) => (
        <tr key={level} className="even:bg-gray-50">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left"> 
                {level}: 
            </td>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-center"> 
                {count} 
            </td>
        </tr>
    ))}
    </table>
  </div>
);

const SearchIntentDistribution: React.FC<{distribution: Record<string, number>}> = ({ distribution }) => (
  <div className="search-intent-distribution">
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase  py-4'>Search Intent Distribution</h2>
    </div>
    <table className="divide-y divide-gray-300 text-center m-auto">
    {Object.entries(distribution).map(([intent, count]) => (
        <tr key={intent} className="even:bg-gray-50">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left capitalize"> 
                {intent}: 
            </td>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-center"> 
                {count} 
            </td>
        </tr>
    ))}
    </table>
  </div>
);

const TrendingKeywords: React.FC<{keywords: Array<{keyword: string; rankImprovement: number}>}> = ({ keywords }) => (
  <div className="trending-keywords px-6 lg:px-8">       
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase  py-4'>Trending Keywords</h2>
    </div>
    <table className="divide-y divide-gray-300 text-center m-auto">
        <thead>
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
              Keyword
            </th>
            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
              Rank Improvement
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
      {keywords.map(keyword => (
        <tr key={keyword.keyword} className="even:bg-gray-50">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left capitalize"> 
                {keyword.keyword} 
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {keyword.rankImprovement}
            </td>
        </tr>
      ))}
      </tbody>
    </table>
  </div>
);

const PotentialOpportunities: React.FC<{opportunities: Array<{keyword: string; rank: number}>}> = ({ opportunities }) => (
  <div className="potential-opportunities px-6 lg:px-8">
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase  py-4'>Potential Opportunities</h2>
    </div>
    <ul>
      {opportunities.map(opportunity => (
        <li key={opportunity.keyword}>
          {opportunity.keyword} - Current Rank: {opportunity.rank}
        </li>
      ))}
    </ul>
  </div>
);

const SerpFeatureDistribution: React.FC<{distribution: Record<string, number>}> = ({ distribution }) => (
  <div className="serp-feature-distribution  px-6 lg:px-8">
    <div className='border-b border-gray-200'>
        <h2 className='text-center tracking-wider font-bold text-sm text-gray-900 uppercase  py-4'>SERP Feature Distribution</h2>
    </div>
    <table className="divide-y divide-gray-300 text-center m-auto">
      <thead>
        <tr>
          <th className="px-4 py-2 text-sm font-semibold text-gray-900">Feature</th>
          <th className="px-4 py-2 text-sm font-semibold text-gray-900">Count</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(distribution).map(([feature, count]) => (
          <tr key={feature} className="even:bg-gray-50">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left capitalize">
              {feature.replace(/_/g, ' ')}
            </td>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-center">
              {count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RankingsSummaryView;
