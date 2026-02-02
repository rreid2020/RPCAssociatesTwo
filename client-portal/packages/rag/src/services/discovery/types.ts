import type { PageKind } from '@shared/types';

/**
 * Represents a discovered link from a directory page
 */
export interface DiscoveredLink {
  url: string;
  title: string;
  normalizedUrl: string;
}

/**
 * Result of a discovery operation
 */
export interface DiscoveryResult {
  sourceId: string;
  pageKind: PageKind;
  discoveredLinks: DiscoveredLink[];
  newSourcesCreated: number;
  skippedDuplicates: number;
  skippedPdfDuplicates?: number;
  errors: Array<{ url: string; error: string }>;
}


