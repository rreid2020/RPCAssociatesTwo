/**
 * Trigger a download from a URL.
 *
 * Cross-origin (e.g. DigitalOcean Spaces / S3 public URLs): we must NOT use
 * `fetch()` unless the bucket CORS allows your site — otherwise the browser
 * throws and the UI can look broken. Opening the resource via a temporary
 * <a> avoids CORS for GET navigation.
 */
function isSameOrigin (url: string): boolean {
  try {
    return new URL(url, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

function downloadViaNavigation (url: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = url
  a.rel = 'noopener noreferrer'
  a.target = '_blank'
  a.setAttribute('download', fileName)
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  const fileName = filename || url.split('/').pop() || 'download'

  if (isSameOrigin(url)) {
    try {
      const response = await fetch(url, { method: 'GET' })
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
      downloadViaNavigation(url, fileName)
    }
    return
  }

  // Cross-origin (Spaces, CDN): navigation — no CORS for script-visible fetch
  try {
    downloadViaNavigation(url, fileName)
  } catch (error) {
    console.error('Error downloading file:', error)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
