export const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
        <p className="text-sm text-gray-900">Processing payment...</p>
      </div>
    </div>
  );
};
