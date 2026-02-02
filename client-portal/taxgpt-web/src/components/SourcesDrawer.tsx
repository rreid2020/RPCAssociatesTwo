interface Source {
  id: string;
  title: string;
  url: string;
}

interface SourcesDrawerProps {
  sources: Source[];
  onClose: () => void;
}

export default function SourcesDrawer({ sources, onClose }: SourcesDrawerProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold">Sources</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {sources.length === 0 ? (
          <p className="text-gray-500 text-sm">No sources available</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.id} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

