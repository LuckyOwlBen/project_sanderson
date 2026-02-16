const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

function findChromeWindows() {
  const candidates = [];
  const pf = process.env['PROGRAMFILES'] || 'C:\\Program Files';
  const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
  const local =
    process.env['LOCALAPPDATA'] ||
    path.join(process.env['USERPROFILE'] || 'C:\\Users\\Default', 'AppData', 'Local');

  candidates.push(path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  candidates.push(path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  candidates.push(path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  candidates.push(
    path.join(
      process.env['USERPROFILE'] || '',
      'AppData',
      'Local',
      'Google',
      'Chrome',
      'Application',
      'chrome.exe'
    )
  );

  // check PATH using where.exe
  try {
    const whereOut = execSync('where chrome', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .split(/\r?\n/)
      .filter(Boolean);
    whereOut.forEach((p) => candidates.push(p.trim()));
  } catch (e) {
    // ignore
  }

  for (const c of candidates) {
    if (c && exists(c)) return c;
  }
  return null;
}

function findChrome() {
  if (process.platform === 'win32') return findChromeWindows();
  // macOS
  if (process.platform === 'darwin') {
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (exists(macPath)) return macPath;
  }
  // linux
  try {
    const whichOut = execSync('which google-chrome || which chromium-browser || which chrome', {
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: true,
    })
      .toString()
      .split(/\r?\n/)
      .filter(Boolean);
    if (whichOut.length) return whichOut[0].trim();
  } catch (e) {}
  return null;
}

function extractFirstJsonObject(raw) {
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) return raw.slice(start, i + 1);
  }
  return null;
}

function updateLaunchJson(chromePath) {
  const launchPath = path.join(__dirname, '..', '.vscode', 'launch.json');
  if (!exists(launchPath)) {
    console.error('launch.json not found at', launchPath);
    process.exitCode = 2;
    return;
  }
  const raw = fs.readFileSync(launchPath, 'utf8');
  const jsonText = extractFirstJsonObject(raw);
  if (!jsonText) {
    console.error('Could not locate JSON object in launch.json');
    process.exitCode = 3;
    return;
  }
  let json;
  try {
    json = JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse launch.json JSON object:', e.message);
    process.exitCode = 3;
    return;
  }
  let changed = false;
  if (Array.isArray(json.configurations)) {
    json.configurations = json.configurations.map((cfg) => {
      if (!cfg.runtimeExecutable || /chrome/i.test(String(cfg.runtimeExecutable))) {
        cfg.runtimeExecutable = chromePath;
        changed = true;
      }
      return cfg;
    });
  }
  if (changed) {
    // write updated JSON back into file, replacing the first JSON object
    const newJsonText = JSON.stringify(json, null, 2) + '\n';
    const before = raw.slice(0, raw.indexOf('{'));
    const afterIndex = raw.indexOf(jsonText) + jsonText.length;
    const after = raw.slice(afterIndex);
    fs.writeFileSync(launchPath, before + newJsonText + after, 'utf8');
    console.log('Updated', launchPath, 'with', chromePath);
  } else {
    console.log('No runtimeExecutable fields needed updating.');
  }
}

const chrome = findChrome();
if (!chrome) {
  console.error('Chrome not detected on this system.');
  process.exitCode = 1;
} else {
  updateLaunchJson(chrome);
}
