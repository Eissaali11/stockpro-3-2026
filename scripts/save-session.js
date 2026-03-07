#!/usr/bin/env node
/**
 * scripts/save-session.js
 * Simple utility to save session text into `sessions/sessions.json`.
 * Usage:
 *  - Pipe content:
 *      echo "My session text" | node scripts/save-session.js --title="Notes"
 *  - Read from file:
 *      node scripts/save-session.js --source=path/to/file.txt --title="From file"
 *  - Specify sessions file location:
 *      node scripts/save-session.js --sessions-file=sessions/my-sessions.json --source=...
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const map = {};
  args.forEach(arg => {
    if (arg === '-h' || arg === '--help') map.help = true;
    else if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        const key = arg.slice(2, eq);
        const val = arg.slice(eq + 1);
        map[key] = val;
      } else {
        const key = arg.slice(2);
        map[key] = true;
      }
    }
  });
  return map;
}

function printHelp() {
  console.log('Usage: node scripts/save-session.js [--sessions-file=path] [--source=path] [--content=string] [--title=title]');
  console.log('\nOptions:');
  console.log('  --sessions-file=path   Path to sessions JSON file (default: sessions/sessions.json)');
  console.log('  --source=path          Read session content from a file');
  console.log('  --content="..."       Provide session content as an argument (no piping)');
  console.log('  --title="..."         Optional title/summary for the session entry');
  console.log('  -h, --help             Show this help');
}

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

(async function main() {
  const argv = parseArgs();
  if (argv.help) {
    printHelp();
    return;
  }

  const sessionsFile = argv['sessions-file'] || 'sessions/sessions.json';
  const title = argv.title || '';

  let content = '';
  if (argv.source) {
    const src = argv.source;
    if (!fs.existsSync(src)) {
      console.error('Source file not found:', src);
      process.exit(1);
    }
    content = fs.readFileSync(src, 'utf8');
  } else if (argv.content) {
    content = argv.content;
  } else if (!process.stdin.isTTY) {
    content = await readStdin();
  } else {
    console.error('No content provided. Provide --source, --content, or pipe text via stdin. Use --help');
    process.exit(1);
  }

  const dir = path.dirname(sessionsFile);
  fs.mkdirSync(dir, { recursive: true });

  let sessions = [];
  if (fs.existsSync(sessionsFile)) {
    try {
      const raw = fs.readFileSync(sessionsFile, 'utf8');
      sessions = JSON.parse(raw);
      if (!Array.isArray(sessions)) sessions = [];
    } catch (e) {
      sessions = [];
    }
  }

  const entry = {
    id: Date.now(),
    created: new Date().toISOString(),
    title: title || '',
    content: content
  };

  sessions.push(entry);
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8');
  console.log('Saved session to', sessionsFile);
})().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(2);
});
