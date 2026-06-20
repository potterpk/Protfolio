const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'writeups.json');

// simple async write queue so concurrent POSTs don't clobber each other
let busy   = false;
let queued = null;

function read() {
  if (!fs.existsSync(FILE)) return { next: 1, writeups: [] };
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function write(data) {
  queued = data;
  if (!busy) flush();
}

function flush() {
  if (!queued) { busy = false; return; }
  busy = true;
  const snapshot = queued;
  queued = null;
  fs.writeFile(FILE, JSON.stringify(snapshot, null, 2), () => flush());
}

module.exports = { read, write };
