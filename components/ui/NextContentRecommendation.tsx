// Helper function to convert competition float to readable text
const getCompetitionLevel = (competition: number): string => {
  if (competition >= 0.8) return "Very High";
  if (competition >= 0.6) return "High";
  if (competition >= 0.4) return "Medium";
  if (competition >= 0.2) return "Low";
  return "Very Low";
};

export const NextContentRecommendation = ({ contentRecommendation }: { contentRecommendation: any }) => {
  if (!contentRecommendation) return null;
  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-900/10">
      <div className="p-6">
        <h2 className="text-base font-semibold leading-7 text-gray-900">
          Next Piece of Content to Create
        </h2>

        {!contentRecommendation[0] ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Loading recommendation...</div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Type of Content</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].content_type}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Potential Reach</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].search_volume} Searches per Month
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Competition</h3>
              <p className="mt-2 text-sm text-gray-500">
                {getCompetitionLevel(contentRecommendation[0].competition)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Focus Keyword</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].keyword}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Content Type</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].content_type}
              </p>
            </div>
            <button className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >Create with Espy Go</button>
          </div>
        )}
      </div>
    </div>
  );
};