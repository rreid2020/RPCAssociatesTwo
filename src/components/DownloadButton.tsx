import { FC } from 'react'
import { SanityDownload, SanityFileAsset } from '../lib/sanity/types'

interface DownloadButtonProps {
  download: SanityDownload
}

const DownloadButton: FC<DownloadButtonProps> = ({ download }) => {
  // Type guard to check if asset is dereferenced (has url)
  const asset = download.file?.asset as SanityFileAsset | undefined
  
  if (!asset || !asset.url) {
    return null
  }

  const fileUrl = asset.url
  const filename = asset.originalFilename || 'download'
  const buttonText = download.buttonText || 'Download'
  const fileSize = asset.size
    ? `${(asset.size / 1024).toFixed(1)} KB`
    : null

  return (
    <div className="flex items-start justify-between gap-md p-md bg-gray-50 rounded-lg border border-border transition-all hover:border-primary hover:shadow-sm flex-col md:flex-row md:items-start">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-text mb-xs">{download.title || filename}</h3>
        {download.description && (
          <p className="text-text-light text-[0.9375rem] mb-xs leading-relaxed">{download.description}</p>
        )}
        {fileSize && (
          <p className="text-text-light text-sm m-0">({fileSize})</p>
        )}
      </div>
      <a
        href={fileUrl}
        download={filename}
        className="btn btn--primary flex-shrink-0 whitespace-nowrap w-full md:w-auto text-center"
        target="_blank"
        rel="noopener noreferrer"
      >
        {buttonText}
      </a>
    </div>
  )
}

export default DownloadButton

