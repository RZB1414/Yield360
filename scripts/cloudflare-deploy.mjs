import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(repoRoot, '.env');

function loadRootEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const envFileContent = readFileSync(filePath, 'utf8');

  for (const rawLine of envFileContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: true,
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 1}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  loadRootEnv(envFilePath);

  const target = process.argv[2];

  if (!target) {
    throw new Error('Missing deploy target. Use api-build, api-deploy, or web-deploy.');
  }

  if (!process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN in the root .env file.');
  }

  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID in the root .env file.');
  }

  if (target === 'api-build') {
    await runCommand('wrangler', ['deploy', '--dry-run', '--outdir', 'dist'], path.join(repoRoot, 'apps', 'api'));
    return;
  }

  if (target === 'api-deploy') {
    await runCommand('wrangler', ['deploy'], path.join(repoRoot, 'apps', 'api'));
    return;
  }

  if (target === 'web-deploy') {
    const pagesProjectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME || 'yield-360-web';
    const webDir = path.join(repoRoot, 'apps', 'web');

    await runCommand('npm', ['run', 'build'], webDir);
    await runCommand('wrangler', ['pages', 'deploy', 'dist', '--project-name', pagesProjectName], webDir);
    return;
  }

  throw new Error(`Unknown deploy target: ${target}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});