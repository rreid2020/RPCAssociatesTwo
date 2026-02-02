import { getStorageConfig } from '@shared/types';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';
import type { StorageProvider } from './provider';

export function createStorageProvider(): StorageProvider {
  const config = getStorageConfig();

  if (config.driver === 's3') {
    if (!config.s3) {
      throw new Error('S3 configuration is required when using s3 driver');
    }
    return new S3StorageProvider(
      config.s3.endpoint,
      config.s3.bucket,
      config.s3.accessKey,
      config.s3.secretKey,
      config.s3.region
    );
  }

  if (!config.local) {
    throw new Error('Local storage configuration is required when using local driver');
  }
  return new LocalStorageProvider(config.local.path);
}

