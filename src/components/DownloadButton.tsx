import { FC } from 'react'
import { SanityDownload } from '../lib/sanity/types'

interface DownloadButtonProps {
  download: SanityDownload
}

const DownloadButton: FC<DownloadButtonProps> = ({ download }) => {
  if (!download.file?.asset?.url) {
    return null
  }

  const fileUrl = download.file.asset.url
  const filename = download.file.asset.originalFilename || 'download'
  const buttonText = download.buttonText || 'Download'
  const fileSize = download.file.asset.size
    ? `${(download.file.asset.size / 1024).toFixed(1)} KB`
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

