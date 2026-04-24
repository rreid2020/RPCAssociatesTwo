/**
 * Inbound notification address for public form submissions (leads, contact).
 * Set NOTIFICATION_EMAIL on the server (e.g. contact@ or info@ at axiomft.ca).
 */
const DEFAULT_NOTIFICATION = 'info@axiomft.ca'

export function getNotificationInbox () {
  return process.env.NOTIFICATION_EMAIL?.trim() ||
    process.env.SHARED_MAILBOX_ADDRESS?.trim() ||
    DEFAULT_NOTIFICATION
}
