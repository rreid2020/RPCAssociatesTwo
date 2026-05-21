export type NotificationChannel = 'in_app' | 'email'

export interface NotificationMessage {
  id: string
  workspaceId: string
  recipientUserId: string
  channel: NotificationChannel
  title: string
  body: string
  createdAt: string
}
