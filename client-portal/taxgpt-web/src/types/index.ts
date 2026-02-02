export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: Date;
  reasoning?: string[];
  actions?: Array<{ type: string; description: string }>;
}

export interface Citation {
  id: string;
  chunkId: string;
  sourceTitle: string;
  sourceUrl: string;
  sectionHeading?: string;
  pageNumber?: number;
  retrievedAt: Date;
  similarityScore?: number;
}

export type RiskLevel = 'low' | 'medium' | 'high';

