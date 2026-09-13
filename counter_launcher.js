import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('🛒  STARTING KARUNA HOTEL POS - COUNTER BILLING DESKTOP TERMINAL');
console.log('================================================================\n');

// Read server IP from config or command line
let serverIp = '10.40.145.195';
const configFile = path.join(__dirname, 'server_config.json');

if (process.argv[2] && process.argv[2].trim() !== '') {
  serverIp = process.argv[2].trim();
} else if (fs.existsSync(configFile)) {
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    if (config.serverIp && config.serverIp !== 'localhost') {
      serverIp = config.serverIp.trim();
    }
  } catch (e) {}
}

console.log(`📍 Master Database Server LAN IP: ${serverIp}`);
console.log('🖥️ Launching Standalone Native Desktop POS Window...\n');

const electronCli = path.join(__dirname, 'node_modules', 'electron', 'cli.js');
const mainScript = path.join(__dirname, 'electron', 'main.js');

const electronProcess = spawn(process.execPath, [electronCli, mainScript], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    MASTER_SERVER_IP: serverIp
  }
});

electronProcess.on('close', (code) => {
  console.log(`\n👋 Counter Desktop Application closed (code ${code}).`);
  process.exit(0);
});

