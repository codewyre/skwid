import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

/**
 * Get's the file path to a module's folder.
 */
export function getModuleDir(moduleEntry: string, relativeToFile: string = __filename) {
    const packageName = moduleEntry.includes('/')
        ? moduleEntry.startsWith('@')
            ? moduleEntry.split('/').slice(0, 2).join('/')
            : moduleEntry.split('/')[0]
        : moduleEntry;
    const require = createRequire(relativeToFile);
    const lookupPaths: string[] = (require.resolve
      .paths(moduleEntry) ?? [])
      .map((basePath: string) => path.join(basePath, packageName));
    return lookupPaths.find((basePath: string) => fs.existsSync(basePath));
};