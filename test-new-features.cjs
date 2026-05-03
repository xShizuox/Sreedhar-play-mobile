const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
let passed = 0, failed = 0;
const results = [];

function pass(label, ok, detail) {
  if (ok) { passed++; console.log(`  ✅ PASS  [${label}] ${detail || ''}`); }
  else    { failed++; console.log(`  ❌ FAIL  [${label}] ${detail || ''}`); }
  results.push({ label, ok, detail });
}

function jsonReq(method, urlPath, body, headers) {
  return new Promise(resolve => {
    const opts = {
      hostname: 'localhost', port: 3000, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function multipartReq(urlPath, token, fields, files) {
  return new Promise(resolve => {
    const boundary = '----FormBoundary' + Date.now();
    let body = Buffer.alloc(0);

    for (const [name, value] of Object.entries(fields)) {
      const part = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
      body = Buffer.concat([body, Buffer.from(part)]);
    }

    for (const { fieldName, filename, mimeType, data } of files) {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
      body = Buffer.concat([body, Buffer.from(header), data, Buffer.from('\r\n')]);
    }

    body = Buffer.concat([body, Buffer.from(`--${boundary}--\r\n`)]);

    const opts = {
      hostname: 'localhost', port: 3000, path: urlPath, method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', e => resolve({ status: 0, error: e.message }));
    r.write(body);
    r.end();
  });
}

function makeMinimalMp3() {
  const id3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const mpegFrame = Buffer.from([0xFF, 0xFB, 0x90, 0x00]);
  const silence = Buffer.alloc(417, 0x00);
  return Buffer.concat([id3, mpegFrame, silence]);
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║       SREEDHAR PLAY — NEW FEATURES TEST SUITE     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // 1. Setup Auth
  const ts = Date.now();
  const signup = await jsonReq('POST', '/api/v1/auth/signup', { username: `test_${ts}`, email: `t_${ts}@test.com`, password: 'pw' });
  const token = signup.body?.token;
  if (!token) return console.error('Auth failed', signup);

  // 2. Upload Song to Test Quality detection and Deletion
  const mp3Data = makeMinimalMp3();
  const upload = await multipartReq('/api/v1/songs/upload', token, { title: 'Test Quality/Delete' }, [
    { fieldName: 'song', filename: 'test-song.mp3', mimeType: 'audio/mpeg', data: mp3Data }
  ]);
  
  const songId = upload.body?.id;
  const filePath = upload.body?.file_path;
  const quality = upload.body?.quality;
  
  pass('Upload valid mock MP3', upload.status === 200);
  // since it's a mock MP3, bitrate might not be detected cleanly by music-metadata, so fallback is 320kbps
  pass('Quality field populated', !!quality, `quality=${quality}`);

  // 3. Comments API
  console.log('\n── COMMENTS API ───────────────────────────');
  const commentPost = await jsonReq('POST', `/api/v1/songs/${songId}/comments`, { content: 'This is a test comment!' }, { Authorization: `Bearer ${token}` });
  pass('POST /comments', commentPost.status === 200, `content="${commentPost.body?.content}"`);

  const commentGet = await jsonReq('GET', `/api/v1/songs/${songId}/comments`);
  pass('GET /comments', commentGet.status === 200 && Array.isArray(commentGet.body) && commentGet.body.length === 1, `count=${commentGet.body?.length}`);
  pass('Comment includes user info', !!commentGet.body?.[0]?.user?.username, `username=${commentGet.body?.[0]?.user?.username}`);

  // 4. Pagination
  console.log('\n── PAGINATION ─────────────────────────────');
  const paginatedFeed = await jsonReq('GET', '/api/v1/feed?page=1&limit=1');
  pass('GET /feed respects limit', paginatedFeed.status === 200 && paginatedFeed.body.length <= 1, `count=${paginatedFeed.body?.length}`);

  const paginatedSongs = await jsonReq('GET', '/api/v1/songs?page=1&limit=1');
  pass('GET /songs respects limit', paginatedSongs.status === 200 && paginatedSongs.body.length <= 1, `count=${paginatedSongs.body?.length}`);

  // 5. Deletion
  console.log('\n── SONG DELETION ──────────────────────────');
  const fullPath = filePath ? path.join(__dirname, filePath) : '';
  const fileExistsBefore = fs.existsSync(fullPath);
  pass('File exists on disk before delete', fileExistsBefore, `path=${fullPath}`);

  const deleteRes = await jsonReq('DELETE', `/api/v1/songs/${songId}`, null, { Authorization: `Bearer ${token}` });
  pass('DELETE /songs/:songId', deleteRes.status === 200, `message=${deleteRes.body?.message}`);

  const fileExistsAfter = fs.existsSync(fullPath);
  pass('File removed from disk after delete', !fileExistsAfter);

  const getDeleted = await jsonReq('GET', `/api/v1/songs`);
  const stillExists = getDeleted.body?.some((s) => s.id === songId);
  pass('Song removed from DB', !stillExists);

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log(`║  RESULT: ${passed}/${passed+failed} PASSED   ${failed} FAILED                            ║`);
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  if (failed > 0) process.exit(1);
}

main().catch(console.error);
