import { FC } from 'react'

type Source = {
  id: string
  title: string
  url: string
}

type SourcesDrawerProps = {
  sources: Source[]
  onClose: () => void
}

const SourcesDrawer: FC<SourcesDrawerProps> = ({ sources, onClose }) => (
  <div className="w-80 bg-white border-l border-border flex flex-col">
    <div className="p-4 border-b border-border flex items-center justify-between">
      <h2 className="font-semibold text-primary-dark">Sources</h2>
      <button type="button" onClick={onClose} className="text-text-light hover:text-text" aria-label="Close sources">
        ×
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      {sources.length === 0 ? (
        <p className="text-text-light text-sm">No sources available for this response yet.</p>
      ) : (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li key={source.id} className="text-sm">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)

export default SourcesDrawer
