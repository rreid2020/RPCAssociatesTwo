import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { StorageProvider } from './provider';

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {}

  async upload(key: string, buffer: Buffer, _contentType?: string): Promise<string> {
    const filePath = join(this.basePath, key);
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = join(this.basePath, key);
    return await fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.basePath, key);
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getUrl(key: string): Promise<string> {
    const filePath = join(this.basePath, key);
    return `file://${filePath}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = join(this.basePath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

