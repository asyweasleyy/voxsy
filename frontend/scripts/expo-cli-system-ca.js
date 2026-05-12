const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const expoCliPath = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');
const expoArgs = process.argv.slice(2);
const cursorNodePath = process.env.LOCALAPPDATA
  ? path.join(
      process.env.LOCALAPPDATA,
      'Programs',
      'cursor',
      'resources',
      'app',
      'resources',
      'helpers',
      'node.exe'
    )
  : null;

function supportsUseSystemCa(nodePath) {
  if (!nodePath || !fs.existsSync(nodePath)) {
    return false;
  }

  const result = spawnSync(nodePath, ['--help'], {
    encoding: 'utf8',
    windowsHide: true,
  });

  return result.status === 0 && result.stdout.includes('--use-system-ca');
}

function resolveNodeBinary() {
  const candidates = [process.execPath, cursorNodePath];
  const supportedNode = candidates.find(supportsUseSystemCa);
  return supportedNode ?? process.execPath;
}

const nodeBinary = resolveNodeBinary();
const nodeArgs = supportsUseSystemCa(nodeBinary)
  ? ['--use-system-ca', expoCliPath, ...expoArgs]
  : [expoCliPath, ...expoArgs];

const child = spawn(nodeBinary, nodeArgs, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to launch Expo CLI with system CA:', error);
  process.exit(1);
});
