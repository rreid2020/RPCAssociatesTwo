import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync, unlinkSync, rmdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');
const srcDir = join(__dirname, '../src');

// Function to ensure a .js file exists for a module
function ensureJsFile(relativePath) {
  const jsPath = join(distDir, relativePath + '.js');
  const dtsPath = join(distDir, relativePath + '.d.ts');
  
  // If .d.ts exists but .js doesn't, create an empty .js file
  // OR if neither exists but the directory exists, create both
  const dir = dirname(jsPath);
  const dirExists = existsSync(dir);
  
  if (dirExists && !existsSync(jsPath)) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(jsPath, 'export {};\n', 'utf8');
    console.log(`Created ${relativePath}.js`);
    return true;
  }
  return false;
}

// Ensure types/index.js exists (type-only module needs empty export)
const typesDir = join(distDir, 'types');
if (!existsSync(typesDir)) {
  mkdirSync(typesDir, { recursive: true });
}
ensureJsFile('types/index');

// Ensure all other modules have .js files
const modules = ['constants', 'utils', 'db', 'http', 'config'];
for (const module of modules) {
  // Special handling for utils module - check for logger.js
  if (module === 'utils') {
    const utilsDir = join(distDir, 'utils');
    if (existsSync(utilsDir)) {
      const loggerDts = join(utilsDir, 'logger.d.ts');
      const loggerJs = join(utilsDir, 'logger.js');
      if (existsSync(loggerDts) && !existsSync(loggerJs)) {
        writeFileSync(loggerJs, 'export {};\n', 'utf8');
        console.log('Created utils/logger.js');
      }
    }
  }
  const moduleDir = join(distDir, module);
  const moduleSrcDir = join(srcDir, module);
  
  // If source directory exists, ensure the dist module has index.js
  if (existsSync(moduleSrcDir)) {
    const moduleIndexJs = join(moduleDir, 'index.js');
    const moduleIndexDts = join(moduleDir, 'index.d.ts');
    
    // Create directory if it doesn't exist
    if (!existsSync(moduleDir)) {
      mkdirSync(moduleDir, { recursive: true });
    }
    
    // If .d.ts exists but .js doesn't, or if neither exists, create .js
    if (existsSync(moduleIndexDts) && !existsSync(moduleIndexJs)) {
      writeFileSync(moduleIndexJs, 'export {};\n', 'utf8');
      console.log(`Created ${module}/index.js`);
    } else if (!existsSync(moduleIndexJs) && !existsSync(moduleIndexDts)) {
      // If TypeScript didn't create anything, still create the .js file
      writeFileSync(moduleIndexJs, 'export {};\n', 'utf8');
      console.log(`Created ${module}/index.js (no .d.ts found)`);
    }
    
    // Check for individual files in modules that might be type-only
    // (e.g., db/schema.ts, db/client.ts, http/client.ts might not emit .js files)
    if (module === 'db' || module === 'http') {
      // Check all .d.ts files in the module directory
      if (existsSync(moduleDir)) {
        const dtsFiles = readdirSync(moduleDir).filter(f => f.endsWith('.d.ts') && f !== 'index.d.ts');
        for (const dtsFile of dtsFiles) {
          const baseName = dtsFile.replace('.d.ts', '');
          const fileJs = join(moduleDir, `${baseName}.js`);
          if (!existsSync(fileJs)) {
            writeFileSync(fileJs, 'export {};\n', 'utf8');
            console.log(`Created ${module}/${baseName}.js`);
          }
        }
      }
    }
  }
}

// Ensure main index.js exists with all exports
const mainIndexJs = join(distDir, 'index.js');
const mainIndexContent = `export * from './types/index.js';
export * from './constants/index.js';
export * from './utils/index.js';
export * from './db/index.js';
export * from './http/index.js';

// Explicitly re-export config functions and types
export {
  getDatabaseConfig,
  getOpenAIConfig,
  getStorageConfig,
  getCrawlerConfig,
  getAppConfig,
  getClerkConfig,
} from './config/index.js';

// Re-export db schema and functions
export { sources, documents, chunks, embeddings, chatSessions, chatMessages, users } from './db/schema.js';
export { getDb, ensureDbValidated } from './db/client.js';

// Re-export http functions
export { requestText, requestBytes } from './http/client.js';

// Re-export constants
export {
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  DEFAULT_TOP_K,
  MAX_TOP_K,
  CRA_BASE_URL,
  CRA_FORMS_PUBLICATIONS_URL,
} from './constants/index.js';

// Explicitly re-export logger
export { logger } from './utils/index.js';
`;

// Always update index.js to ensure all exports are present
writeFileSync(mainIndexJs, mainIndexContent, 'utf8');
console.log('Updated dist/index.js with all exports');

// Fix nested directory structure issue (dist/http/http/ -> dist/http/)
const httpHttpDir = join(distDir, 'http', 'http');
if (existsSync(httpHttpDir)) {
  const httpDir = join(distDir, 'http');
  const files = readdirSync(httpHttpDir);
  for (const file of files) {
    const srcPath = join(httpHttpDir, file);
    const destPath = join(httpDir, file);
    if (existsSync(srcPath)) {
      if (existsSync(destPath)) {
        // If destination exists and source is larger (actual compiled file), replace it
        const srcSize = statSync(srcPath).size;
        const destSize = statSync(destPath).size;
        if (srcSize > destSize) {
          writeFileSync(destPath, readFileSync(srcPath), 'utf8');
          console.log(`Replaced ${file} with compiled version`);
        }
      } else {
        writeFileSync(destPath, readFileSync(srcPath), 'utf8');
        console.log(`Moved ${file} from http/http/ to http/`);
      }
    }
  }
  // Remove the nested directory
  const remainingFiles = readdirSync(httpHttpDir);
  if (remainingFiles.length === 0) {
    readdirSync(httpHttpDir, { withFileTypes: true }).forEach(dirent => {
      if (dirent.isDirectory()) {
        readdirSync(join(httpHttpDir, dirent.name)).forEach(file => {
          const srcPath = join(httpHttpDir, dirent.name, file);
          const destPath = join(httpDir, file);
          if (existsSync(srcPath) && !existsSync(destPath)) {
            writeFileSync(destPath, readFileSync(srcPath), 'utf8');
          }
        });
      }
    });
  }
  try {
    readdirSync(httpHttpDir, { recursive: true }).forEach(() => {});
    // Directory is empty, safe to remove
    readdirSync(httpHttpDir).forEach(file => {
      const filePath = join(httpHttpDir, file);
      if (statSync(filePath).isFile()) {
        unlinkSync(filePath);
      }
    });
    rmdirSync(httpHttpDir);
    console.log('Removed nested http/http/ directory');
  } catch (e) {
    // Directory not empty or other error, skip
  }
}

console.log('Post-build script completed');
