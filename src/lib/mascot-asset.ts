import { closeSync, openSync, readSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Only enable the intro when the actual video exists at build time.
 * A placeholder filename or empty/broken asset must never display a 280svh blank scene.
 */
export function hasMascotVideo(projectRoot: string = process.cwd()): boolean {
  const filename = join(projectRoot, 'public', 'media', 'ventorme-mascot-intro.mp4');
  let handle: number | undefined;
  try {
    const stat = statSync(filename);
    if (!stat.isFile() || stat.size < 2048) return false;
    handle = openSync(filename, 'r');
    const header = Buffer.alloc(12);
    if (readSync(handle, header, 0, header.length, 0) !== header.length) return false;
    return header.toString('ascii', 4, 8) === 'ftyp';
  } catch {
    return false;
  } finally {
    if (handle !== undefined) closeSync(handle);
  }
}
