/**
 * Wraps EAS CLI with --use-system-ca so Windows corporate SSL certificates
 * are trusted. Same approach as expo-cli-system-ca.js.
 *
 * Usage:
 *   node scripts/eas-system-ca.js login
 *   node scripts/eas-system-ca.js build --platform android --profile preview
 */

const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

// Resolve EAS CLI entry point
function findEasCli() {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'eas-cli', 'bin', 'run'),
    path.join(__dirname, '..', 'node_modules', '.bin', 'eas'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  // Fall back to globally installed eas — wrap via npx
  return null;
}

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
  if (!nodePath || !fs.existsSync(nodePath)) return false;
  const result = spawnSync(nodePath, ['--help'], { encoding: 'utf8', windowsHide: true });
  return result.status === 0 && result.stdout.includes('--use-system-ca');
}

function resolveNodeBinary() {
  const candidates = [process.execPath, cursorNodePath];
  return candidates.find(supportsUseSystemCa) ?? process.execPath;
}

const easArgs = process.argv.slice(2);
const nodeBinary = resolveNodeBinary();
const useSystemCa = supportsUseSystemCa(nodeBinary);
const easCliPath = findEasCli();

let child;

if (easCliPath) {
  // Run EAS CLI directly via Node
  const nodeArgs = useSystemCa
    ? ['--use-system-ca', easCliPath, ...easArgs]
    : [easCliPath, ...easArgs];

  child = spawn(nodeBinary, nodeArgs, { stdio: 'inherit', env: process.env });
} else {
  // Fall back: use npx eas with NODE_TLS_REJECT_UNAUTHORIZED workaround
  console.warn('eas-cli not found in node_modules. Falling back to npx eas with system CA env.');
  child = spawn('npx', ['eas', ...easArgs], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(useSystemCa ? {} : { NODE_TLS_REJECT_UNAUTHORIZED: '0' }),
    },
    shell: true,
  });
}

child.on('exit', (code, signal) => {
  if (signal) { process.kill(process.pid, signal); return; }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to launch EAS CLI with system CA:', err);
  process.exit(1);
});
