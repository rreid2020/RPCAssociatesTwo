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
    <div className="download-item">
      <div className="download-item__content">
        <h3 className="download-item__title">{download.title}</h3>
        {download.description && (
          <p className="download-item__description">{download.description}</p>
        )}
        {fileSize && (
          <p className="download-item__size">File size: {fileSize}</p>
        )}
      </div>
      <a
        href={fileUrl}
        download={filename}
        className="btn btn--primary download-item__button"
      >
        {buttonText}
      </a>
    </div>
  )
}

export default DownloadButton

