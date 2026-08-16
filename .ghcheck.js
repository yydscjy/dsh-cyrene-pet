const https = require('https');
const fs = require('fs');
const path = require('path');
const out = path.join(process.cwd(), '.gh.txt');
const req = https.get('https://api.github.com/repos/yydscjy/dsh-cyrene-pet/contents', { headers: { 'User-Agent': 'dsh-check', 'Accept': 'application/vnd.github+json' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const lines = ['status ' + res.statusCode];
    try {
      const j = JSON.parse(d);
      if (Array.isArray(j)) { for (const it of j) lines.push(it.type + '  ' + it.name + '  ' + (it.size || '')); }
      else lines.push('msg: ' + (j.message || ''));
    } catch (e) { lines.push('parse err ' + d.slice(0, 200)); }
    fs.writeFileSync(out, lines.join('\n'));
    process.exit(0);
  });
});
req.on('error', e => { fs.writeFileSync(out, 'ERR ' + e.message); process.exit(1); });
req.setTimeout(15000, () => { req.destroy(); fs.writeFileSync(out, 'TIMEOUT'); process.exit(1); });
