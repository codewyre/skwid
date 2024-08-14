import path from 'path';

import { getModuleDir } from './util/get-module-dir';

const dir = getModuleDir('@codewyre/skwid', path.join(process.cwd(), 'package.json'));
if (dir) {
  require(path.join(dir, 'index'));
} else {
  if (!process.argv.includes('--silent')) {
    console.log('Local version of skwid not found for project, preferring globally installed one.');
  }
  require('./index');
}