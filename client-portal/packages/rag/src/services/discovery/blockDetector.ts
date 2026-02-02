export interface BlockSignature {
  status: number;
  contentType?: string;
  contentLength: number;
  bodySignature: string;
  hasErrorKeywords: {
    accessDenied: boolean;
    forbidden: boolean;
    blocked: boolean;
    bot: boolean;
    captcha: boolean;
    enableJs: boolean;
  };
  wafHeaders?: Record<string, string>;
}

export type BlockType = 
  | 'generic_403'
  | 'waf_challenge'
  | 'bot_detection'
  | 'redirect_stub'
  | 'not_blocked';

export class BlockDetector {
  static classify(signature: BlockSignature): BlockType {
    // Small response + 403 = likely block
    if (signature.status === 403 && signature.contentLength < 2000) {
      if (signature.hasErrorKeywords.captcha || signature.hasErrorKeywords.enableJs) {
        return 'waf_challenge';
      }
      if (signature.hasErrorKeywords.bot || signature.hasErrorKeywords.blocked) {
        return 'bot_detection';
      }
      if (signature.hasErrorKeywords.accessDenied || signature.hasErrorKeywords.forbidden) {
        return 'generic_403';
      }
      // Check for redirect headers
      if (signature.wafHeaders && Object.keys(signature.wafHeaders).length > 0) {
        return 'redirect_stub';
      }
      return 'generic_403';
    }
    return 'not_blocked';
  }
  
  static shouldRetry(blockType: BlockType): boolean {
    // Only retry on transient errors, not on definitive blocks
    return false; // 403 blocks are not retryable
  }
  
  static getBlockReason(blockType: BlockType): string {
    const reasons = {
      generic_403: 'Generic 403 Forbidden - likely WAF/access control',
      waf_challenge: 'WAF challenge page detected (captcha/JS required)',
      bot_detection: 'Bot detection triggered',
      redirect_stub: 'Redirect stub or WAF marker',
      not_blocked: 'Not blocked',
    };
    return reasons[blockType] || 'Unknown block type';
  }
}
