const ARCHIVED_CANCELLED_PATTERN =
  /\b(archived|cancelled|canceled|annul[ée]|annul[e]e|archiv[ée]|archivee)\b/i

export function isArchivedOrCancelledTitle (title?: string | null): boolean {
  if (!title) return false
  return ARCHIVED_CANCELLED_PATTERN.test(title)
}

export function shouldDiscoverSource (title: string): boolean {
  return !isArchivedOrCancelledTitle(title)
}

export type CorpusSourceDisposition = 'index' | 'skip_archived' | 'skip_directory'

export function classifyCorpusDisposition (input: {
  title: string
  pageKind?: string | null
}): CorpusSourceDisposition {
  if (isArchivedOrCancelledTitle(input.title)) {
    return 'skip_archived'
  }
  if (input.pageKind === 'directory') {
    return 'skip_directory'
  }
  return 'index'
}
