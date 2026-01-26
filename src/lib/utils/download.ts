/**
 * Force download a file from a URL (works for cross-origin URLs)
 * @param url - The URL of the file to download
 * @param filename - Optional filename for the downloaded file
 */
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    // Fetch the file
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    // Get the blob
    const blob = await response.blob()

    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob)

    // Extract filename from URL if not provided
    const downloadFilename = filename || url.split('/').pop() || 'download'

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = downloadFilename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error downloading file:', error)
    // Fallback: open in new tab if download fails
    window.open(url, '_blank')
  }
}
