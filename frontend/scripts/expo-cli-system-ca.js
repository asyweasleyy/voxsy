const { spawn } = require('node:child_process');
const path = require('node:path');

const expoCliPath = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');
const expoArgs = process.argv.slice(2);

const child = spawn(process.execPath, ['--use-system-ca', expoCliPath, ...expoArgs], {
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
