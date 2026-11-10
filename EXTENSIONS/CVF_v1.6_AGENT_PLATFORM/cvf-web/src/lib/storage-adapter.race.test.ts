import { expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { setImmediate } from 'node:timers';
import path from 'node:path';
import os from 'node:os';
import { FileEventListAdapter, type EventListFileIO } from './storage-adapter';

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

it('a reader cannot repair a stale partial snapshot over a completed append', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cvf-audit-race-'));
  const file = path.join(directory, 'events.json');
  const entered = barrier();
  const resume = barrier();
  const finished = barrier();
  let armed = true;
  let writing = false;
  let readsDuringWrite = 0;
  const fs: EventListFileIO = {
    mkdir: async () => undefined, // mkdtemp already created this sole directory
    readFile: async (key) => {
      const snapshot = readFileSync(key, 'utf8');
      if (writing && ++readsDuringWrite === 2) {
        // First read is init's existence check. The second captures incomplete
        // JSON. Return that snapshot AFTER the real writer finishes, forcing
        // the destructive repair interleaving rather than relying on timing.
        resume.release();
        await finished.promise;
      }
      return snapshot;
    },
    writeFile: async (key, content) => {
      if (!armed || !content.includes('SOT3_ACTIVATION_EVIDENCE_PERSISTED')) {
        writeFileSync(key, content, 'utf8');
        return;
      }
      armed = false;
      writeFileSync(key, '', 'utf8'); // writeFile's truncate-before-write window
      writing = true;
      entered.release();
      await resume.promise;
      writeFileSync(key, content, 'utf8');
      writing = false;
      finished.release();
    },
  };
  const previous = { eventType: 'SOT3_ACTIVATION' };
  const target = { eventType: 'SOT3_ACTIVATION_EVIDENCE_PERSISTED' };
  const writer = new FileEventListAdapter<typeof previous>(fs);
  // Separate adapter instance, same store (as policy/SIEM readers may use).
  const reader = new FileEventListAdapter<typeof previous>(fs);
  await writeFile(file, JSON.stringify([previous]), 'utf8');
  let append: Promise<void> | undefined;
  let reading: Promise<unknown> | undefined;
  try {
    append = writer.append(file, target);
    await Promise.race([entered.promise, append.then(() => {
      throw new Error('Fixture did not enter the controlled write');
    })]);
    reading = reader.readAll(file);
    // If the reader is correctly queued it cannot enter readFile yet. Release
    // the writer on the next event-loop turn; no sleep, retry or timeout change.
    const turn = new Promise<void>((resolve) => setImmediate(() => {
      resume.release(); resolve();
    }));
    await Promise.all([append, reading, turn]);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([previous, target]);
    expect(await reader.readAll(file)).toEqual([previous, target]);
    expect(readsDuringWrite).toBe(0);
  } finally {
    resume.release();
    await Promise.allSettled([append, reading]);
    await rm(directory, { recursive: true, force: true });
  }
});

it('preserves concurrent appends across instances and relative/absolute paths', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cvf-event-appends-'));
  const file = path.join(directory, 'events.json');
  try {
    await Promise.all(Array.from({ length: 20 }, (_, id) =>
      new FileEventListAdapter<{ id: number }>().append(
        id % 2 ? path.relative(process.cwd(), file) : file, { id },
      )));
    const events = await new FileEventListAdapter<{ id: number }>().readAll(file);
    expect(events.map((event) => event.id).sort((a, b) => a - b))
      .toEqual(Array.from({ length: 20 }, (_, id) => id));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('allows another file to progress while one file is blocked', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cvf-event-independent-'));
  const file = path.join(directory, 'held.json');
  const other = path.join(directory, 'other.json');
  const entered = barrier();
  const release = barrier();
  await writeFile(file, '[]', 'utf8');
  const held = new FileEventListAdapter({
    mkdir, readFile,
    writeFile: async (key, content, encoding) => {
      entered.release();
      await release.promise;
      await writeFile(key, content, encoding);
    },
  }).append(file, { id: 'held' });
  try {
    await entered.promise;
    await new FileEventListAdapter().append(other, { id: 'independent' });
    expect(JSON.parse(await readFile(other, 'utf8'))).toEqual([{ id: 'independent' }]);
  } finally {
    release.release();
    await held;
    await rm(directory, { recursive: true, force: true });
  }
});

it('propagates a failed write without poisoning the next operation on that file', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'cvf-event-failure-'));
  const file = path.join(directory, 'events.json');
  await writeFile(file, '[]', 'utf8');
  try {
    const failed = new FileEventListAdapter({
      mkdir, readFile, writeFile: async () => { throw new Error('injected write failure'); },
    }).append(file, { id: 'failed' });
    const next = new FileEventListAdapter().append(file, { id: 'next' });
    await expect(failed).rejects.toThrow('injected write failure');
    await next;
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([{ id: 'next' }]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
