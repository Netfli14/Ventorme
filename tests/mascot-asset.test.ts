import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasMascotVideo } from '../src/lib/mascot-asset';

test('the intro stays off when original MP4 is not bundled', () => {
  const folder = mkdtempSync(join(tmpdir(), 'ventorme-video-'));
  try {
    assert.equal(hasMascotVideo(folder), false);
    const media = join(folder, 'public', 'media');
    mkdirSync(media, { recursive: true });
    const file = join(media, 'ventorme-mascot-intro.mp4');
    writeFileSync(file, '');
    assert.equal(hasMascotVideo(folder), false);
    writeFileSync(file, Buffer.alloc(2500));
    assert.equal(hasMascotVideo(folder), false);
    const bytes = Buffer.alloc(2500);
    bytes.write('ftyp', 4, 'ascii');
    writeFileSync(file, bytes);
    assert.equal(hasMascotVideo(folder), true);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
