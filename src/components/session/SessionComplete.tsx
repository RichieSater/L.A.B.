import { useNavigate } from 'react-router-dom';

interface SessionCompleteProps {
  advisorName: string;
  onNewSession: () => void;
}

export function SessionComplete({ advisorName, onNewSession }: SessionCompleteProps) {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">&#10003;</div>
      <h3 className="text-2xl font-bold text-gray-100 mb-2">Session Imported</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Your {advisorName} session has been saved. Action items, metrics, and narrative have been updated.
      </p>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors"
        >
          Back to Dashboard
        </button>
        <button
          onClick={onNewSession}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Start Another Session
        </button>
      </div>
    </div>
  );
}
