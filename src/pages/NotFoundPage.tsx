import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">&#128270;</div>
      <h2 className="text-2xl font-bold text-gray-100 mb-2">Page Not Found</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
