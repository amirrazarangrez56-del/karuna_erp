import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('🚀  STARTING KARUNA HOTEL POS - MASTER SERVER AND DESKTOP APP');
console.log('================================================================\n');

// 1. Start Master Database Server (Node.js backend on port 3001)
console.log('📍 [1/3] Starting Central Database Server (Port 3001)...');
const serverScript = path.join(__dirname, 'server', 'server.js');
const serverProcess = spawn(process.execPath, [serverScript], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false
});

// 2. Start Vite UI Server (Port 5173)
console.log('🌐 [2/3] Starting High-Speed LAN UI Service (Port 5173)...');
const viteCli = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const viteProcess = spawn(process.execPath, [viteCli, '--host', '0.0.0.0', '--port', '5173'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) {
        return true;
      }
    } catch (e) {
      // server is still booting
    }
    await sleep(600);
  }
  return false;
}

// 3. Wait for Vite and Launch Standalone Electron Desktop Software
async function startDesktopApp() {
  console.log('⏳ [3/3] Initializing UI server...');
  await waitForServer('http://127.0.0.1:5173');
  console.log('🖥️ [3/3] Launching Native Desktop Software Window...\n');

  const electronCli = path.join(__dirname, 'node_modules', 'electron', 'cli.js');
  const mainScript = path.join(__dirname, 'electron', 'main.js');

  const electronProcess = spawn(process.execPath, [electronCli, mainScript], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      POS_APP_URL: 'http://127.0.0.1:5173'
    }
  });

  electronProcess.on('close', (code) => {
    console.log(`\n👋 Desktop application closed (code ${code}). Stopping background services...`);
    try { serverProcess.kill(); } catch (e) {}
    try { viteProcess.kill(); } catch (e) {}
    process.exit(0);
  });
}

// Handle termination signals
process.on('SIGINT', () => {
  try { serverProcess.kill(); } catch (e) {}
  try { viteProcess.kill(); } catch (e) {}
  process.exit(0);
});

process.on('SIGTERM', () => {
  try { serverProcess.kill(); } catch (e) {}
  try { viteProcess.kill(); } catch (e) {}
  process.exit(0);
});

startDesktopApp();

