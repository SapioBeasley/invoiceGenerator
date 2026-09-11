import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-generator-tests-'));
const typescript = path.resolve('node_modules/typescript/bin/tsc');
const testEnvironment = {
  ...process.env,
  NODE_PATH: [path.resolve('node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
};

try {
  execFileSync(process.execPath, [
    typescript,
    '--project', 'tsconfig.test.json',
    '--outDir', outputDirectory,
  ], { stdio: 'inherit', env: testEnvironment });
  execFileSync(process.execPath, [
    '--test',
    path.join(outputDirectory, 'lib/access.test.js'),
    path.join(outputDirectory, 'lib/accountManagementRules.test.js'),
    path.join(outputDirectory, 'lib/dashboardModules.test.js'),
    path.join(outputDirectory, 'lib/activitySummary.test.js'),
    path.join(outputDirectory, 'lib/loggerData.test.js'),
    path.join(outputDirectory, 'lib/invoiceCalculations.test.js'),
  ], { stdio: 'inherit', env: testEnvironment });
  execFileSync(process.execPath, [
    '--test',
    path.resolve('scripts/generate-markdown-pdf.test.mjs'),
  ], { stdio: 'inherit', env: testEnvironment });
} finally {
  fs.rmSync(outputDirectory, { recursive: true, force: true });
}