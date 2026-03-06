const { execSync } = require('node:child_process');

const port = Number(process.argv[2] || 3001);

function killOnWindows(targetPort) {
  const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes(`:${targetPort}`) || !line.includes('LISTENING')) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      process.stdout.write(`[dev:clean] Killed PID ${pid} on port ${targetPort}\n`);
    } catch {
      process.stdout.write(`[dev:clean] Could not kill PID ${pid}\n`);
    }
  }

  if (pids.size === 0) {
    process.stdout.write(`[dev:clean] No listeners found on port ${targetPort}\n`);
  }
}

function killOnUnix(targetPort) {
  try {
    const pidsRaw = execSync(`lsof -ti tcp:${targetPort}`, { encoding: 'utf8' }).trim();
    if (!pidsRaw) {
      process.stdout.write(`[dev:clean] No listeners found on port ${targetPort}\n`);
      return;
    }

    const pids = pidsRaw.split(/\r?\n/).filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        process.stdout.write(`[dev:clean] Killed PID ${pid} on port ${targetPort}\n`);
      } catch {
        process.stdout.write(`[dev:clean] Could not kill PID ${pid}\n`);
      }
    }
  } catch {
    process.stdout.write(`[dev:clean] No listeners found on port ${targetPort}\n`);
  }
}

if (process.platform === 'win32') {
  killOnWindows(port);
} else {
  killOnUnix(port);
}
