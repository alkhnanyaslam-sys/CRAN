// utils/db.js
// Small helper to read/write our JSON "database" files.
// Keeping it file-based means no external database setup is needed —
// good enough for launch, and easy to swap for a real DB later.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readData(name) {
  const file = filePath(name);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : null;
}

function writeData(name, data) {
  const file = filePath(name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readData, writeData };
