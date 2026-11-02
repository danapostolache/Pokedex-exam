// node --test scripts/check-pokemon-favorites.mjs
// Uses real SQLite through Node's built-in adapter; no installed test dependencies.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import ts from 'typescript';

const fixtures = new Map();
const connections = new Map();
globalThis[Symbol.for('pokedex-favorites-tests')] = fixtures;
const source = await readFile(new URL('../src/services/favorites.ts', import.meta.url), 'utf8');
const stateSource = await readFile(new URL('../src/hooks/favorites-state.ts', import.meta.url), 'utf8');
const hookSource = await readFile(new URL('../src/hooks/use-favorites.ts', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../src/services/pokeapi.ts', import.meta.url), 'utf8');
const dataURL = (code) => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
const compile = (text) => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function fixture(t, existingPath) {
  const directory = existingPath ? undefined : await mkdtemp(join(tmpdir(), 'pokedex-favorites-'));
  const path = existingPath ?? join(directory, 'pokedex.db');
  const id = String(fixtures.size);
  const handles = connections.get(path) ?? new Set();
  connections.set(path, handles);
  const calls = [];
  const control = { fail: undefined, gate: undefined, opened: 0, closed: 0, calls, path };
  async function before(kind, sql, params = []) {
    calls.push({ kind, sql, params });
    if (control.gate?.kind === kind) {
      const gate = control.gate;
      control.gate = undefined;
      gate.entered.resolve();
      await gate.release.promise;
    }
    if (control.fail === kind) {
      control.fail = undefined;
      throw new Error('Controlled ' + kind + ' failure');
    }
  }
  fixtures.set(id, {
    async open(name) {
      assert.equal(name, 'pokedex.db');
      await before('open');
      control.opened++;
      const database = new DatabaseSync(path);
      handles.add(database);
      return {
        async execAsync(sql) {
          const kind = sql.includes('CREATE TABLE') ? 'init' : sql === 'COMMIT' ? 'commit' : sql === 'ROLLBACK' ? 'rollback' : 'begin';
          await before(kind, sql);
          database.exec(sql);
        },
        async runAsync(sql, ...params) {
          await before('write', sql, params);
          return database.prepare(sql).run(...params);
        },
        async getAllAsync(sql) {
          await before('read', sql);
          return database.prepare(sql).all().map((row) => ({ ...row }));
        },
        async closeAsync() { database.close(); handles.delete(database); control.closed++; },
      };
    },
  });
  const adapter = dataURL(`export const openDatabaseAsync = (name) => globalThis[Symbol.for('pokedex-favorites-tests')].get('${id}').open(name);`);
  const serviceURL = dataURL(compile(source).replaceAll("'expo-sqlite'", JSON.stringify(adapter)) + '\n// fixture ' + id);
  const service = await import(serviceURL);
  const stateURL = dataURL(compile(stateSource).replaceAll("'@/services/favorites'", JSON.stringify(serviceURL)));
  const state = await import(stateURL);
  const hooks = await import(dataURL(compile(hookSource)
    .replaceAll("'@/hooks/favorites-state'", JSON.stringify(stateURL))
    .replaceAll("'@tanstack/react-query'", JSON.stringify(import.meta.resolve('@tanstack/react-query')))
    .replaceAll("'react'", JSON.stringify(import.meta.resolve('react')))));
  t?.after(async () => {
    for (const database of handles) database.close();
    handles.clear();
    if (directory) {
      const target = relative(tmpdir(), directory);
      assert(!isAbsolute(target) && !target.startsWith('..') && target.startsWith('pokedex-favorites-'));
      await rm(directory, { recursive: true });
    }
  });
  return { ...service, ...state, ...hooks, control };
}

function clientFor(t) {
  const client = new QueryClient();
  t.after(() => client.clear());
  return client;
}

if (process.argv[2] === '--read-fixture') {
  const service = await fixture(undefined, process.argv[3]);
  process.stdout.write(JSON.stringify(await service.getFavorites()));
} else {
  test('stores only ID/timestamp, preserves duplicate timestamps and survives a new process', async (t) => {
    const service = await fixture(t);
    assert.deepEqual(await service.getFavorites(), []);
    const first = await service.setFavorite(25, true);
    assert.deepEqual(Object.keys(first[0]).sort(), ['created_at', 'pokemon_id']);
    assert.equal(first[0].pokemon_id, 25);
    assert(Number.isSafeInteger(first[0].created_at));
    assert.deepEqual(await service.setFavorite(25, true), first);
    const reopened = JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--read-fixture', service.control.path], { encoding: 'utf8' }));
    assert.deepEqual(reopened, first);
    await service.setFavorite(25, false);
    await service.setFavorite(25, false);
    const afterRemoval = JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--read-fixture', service.control.path], { encoding: 'utf8' }));
    assert.deepEqual(afterRemoval, []);
    assert.equal(service.control.opened, 1);
    assert(service.control.calls.filter(({ kind }) => kind === 'write').every(({ params }) => params.length > 0));
    await assert.rejects(service.setFavorite(-1, true), /cannot be saved/);
  });

  test('newest-first order and ID tie-breaker; concurrent calls share initialization and queue', async (t) => {
    const service = await fixture(t);
    t.mock.method(Date, 'now', () => 100);
    await Promise.all([service.setFavorite(25, true), service.setFavorite(1, true)]);
    t.mock.method(Date, 'now', () => 200);
    assert.deepEqual((await service.setFavorite(133, true)).map(({ pokemon_id }) => pokemon_id), [133, 1, 25]);
    assert.equal(service.control.opened, 1);
  });

  test('failed open/initialization can retry without deleting existing favorites', async (t) => {
    const service = await fixture(t);
    service.control.fail = 'open';
    await assert.rejects(service.getFavorites(), /could not load/);
    service.control.fail = 'init';
    await assert.rejects(service.getFavorites(), /could not load/);
    assert.equal(service.control.closed, 1);
    await service.setFavorite(10002, true);
    assert.equal((await service.getFavorites())[0].pokemon_id, 10002);
    const reopened = await fixture(t, service.control.path);
    reopened.control.fail = 'init';
    await assert.rejects(reopened.getFavorites(), /could not load/);
    assert.equal((await reopened.getFavorites())[0].pokemon_id, 10002);
  });

  test('read, write, post-write read and commit failures retain rows and recover', async (t) => {
    const service = await fixture(t);
    const original = await service.setFavorite(25, true);
    service.control.fail = 'read';
    await assert.rejects(service.getFavorites(), /could not load/);
    assert.deepEqual(await service.getFavorites(), original);
    for (const phase of ['write', 'read', 'commit']) {
      service.control.fail = phase;
      await assert.rejects(service.setFavorite(25, false), /could not be removed/);
      assert.deepEqual(await service.getFavorites(), original);
      service.control.fail = phase;
      await assert.rejects(service.setFavorite(1, true), /could not be saved/);
      assert.deepEqual(await service.getFavorites(), original);
    }
    await service.setFavorite(1, true);
    assert.equal((await service.setFavorite(25, false)).length, 1);
  });

  test('reads cannot enter an in-flight transaction; failed operations do not poison queue', async (t) => {
    const service = await fixture(t);
    const gate = { kind: 'write', entered: deferred(), release: deferred() };
    service.control.gate = gate;
    const save = service.setFavorite(25, true);
    await gate.entered.promise;
    const read = service.getFavorites();
    assert.equal(service.control.calls.filter(({ kind }) => kind === 'read').length, 0);
    gate.release.resolve();
    assert.deepEqual(await read, await save);
    service.control.fail = 'write';
    await assert.rejects(service.setFavorite(25, false));
    assert.equal((await service.getFavorites()).length, 1);
  });

  test('all cache subscribers receive confirmed writes; rapid duplicate taps have one write', async (t) => {
    const service = await fixture(t);
    const client = clientFor(t);
    await client.fetchQuery(service.favoritesQueryOptions);
    const observer = new QueryObserver(client, service.favoritesQueryOptions);
    const seen = [];
    const unsubscribe = observer.subscribe((result) => seen.push(result.data));
    t.after(unsubscribe);
    const gate = { kind: 'write', entered: deferred(), release: deferred() };
    service.control.gate = gate;
    const pending = service.saveFavorite(client, 25, true);
    await gate.entered.promise;
    assert.equal(client.getQueryData(service.favoriteWritesKey)[25].pending, true);
    assert.deepEqual(client.getQueryData(service.favoritesKey), []);
    await service.saveFavorite(client, 25, false);
    gate.release.resolve();
    await pending;
    assert.equal(service.control.calls.filter(({ kind }) => kind === 'write').length, 1);
    assert.equal(observer.getCurrentResult().data[0].pokemon_id, 25);
    assert(seen.some((rows) => rows?.[0]?.pokemon_id === 25));
    assert.equal(client.getQueryData(service.favoriteWritesKey)[25], undefined);
    await Promise.all([service.saveFavorite(client, 1, true), service.saveFavorite(client, 133, true)]);
    assert.equal(client.getQueryData(service.favoritesKey).length, 3);
  });

  test('failed mutations preserve shared membership and Retry uses original target state', async (t) => {
    const service = await fixture(t);
    const client = clientFor(t);
    await client.fetchQuery(service.favoritesQueryOptions);
    await service.saveFavorite(client, 25, true);
    const original = client.getQueryData(service.favoritesKey);
    service.control.fail = 'write';
    await service.saveFavorite(client, 25, false);
    assert.deepEqual(client.getQueryData(service.favoritesKey), original);
    const failed = client.getQueryData(service.favoriteWritesKey)[25];
    assert.equal(failed.pending, false);
    assert.equal(failed.saved, false);
    assert.match(failed.error, /could not be removed/);
    await service.saveFavorite(client, 25, failed.saved);
    assert.deepEqual(client.getQueryData(service.favoritesKey), []);
    service.control.fail = 'write';
    await service.saveFavorite(client, 10002, true);
    const add = client.getQueryData(service.favoriteWritesKey)[10002];
    assert.equal(add.saved, true);
    await service.saveFavorite(client, 10002, add.saved);
    assert.equal(client.getQueryData(service.favoritesKey)[0].pokemon_id, 10002);
  });

  test('cancels stale query reads before a mutation and retains cached IDs on read errors', async (t) => {
    const service = await fixture(t);
    const client = clientFor(t);
    await client.fetchQuery(service.favoritesQueryOptions);
    const gate = { kind: 'read', entered: deferred(), release: deferred() };
    service.control.gate = gate;
    const staleRead = client.fetchQuery({ ...service.favoritesQueryOptions, staleTime: 0 }).catch(() => undefined);
    await gate.entered.promise;
    const save = service.saveFavorite(client, 25, true);
    gate.release.resolve();
    await Promise.all([save, staleRead]);
    assert.equal(client.getQueryData(service.favoritesKey)[0].pokemon_id, 25);
    service.control.fail = 'read';
    await assert.rejects(client.fetchQuery({ ...service.favoritesQueryOptions, staleTime: 0 }));
    assert.equal(client.getQueryState(service.favoritesKey).status, 'error');
    assert.equal(client.getQueryData(service.favoritesKey)[0].pokemon_id, 25);
    await client.fetchQuery({ ...service.favoritesQueryOptions, staleTime: 0 });
    assert.equal(client.getQueryState(service.favoritesKey).status, 'success');
  });

  test('saved IDs survive card metadata failures/404, and per-ID Retry recovers identity', async (t) => {
    const service = await fixture(t);
    await service.setFavorite(10002, true);
    const original = globalThis.fetch;
    t.after(() => { globalThis.fetch = original; });
    const api = await import(dataURL(compile(apiSource)));
    globalThis.fetch = async () => new Response('{}', { status: 404 });
    await assert.rejects(api.getPokemonCard(10002), api.PokemonNotFoundError);
    globalThis.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(api.getPokemonCard(10002), /Could not reach/);
    assert.equal((await service.getFavorites())[0].pokemon_id, 10002);
    globalThis.fetch = async () => new Response(JSON.stringify({ id: 10002, name: 'deoxys-attack', sprites: { front_default: null }, types: [] }));
    const card = await api.getPokemonCard(10002);
    assert.equal(card.id, 10002);
    assert.equal(card.displayName, 'Deoxys Attack');
    assert.equal(card.artwork, null);
    assert.equal((await service.getFavorites()).length, 1);
  });

  test('hooks expose unknown/loading, failed hydration, and shared pending/error/Retry state', async (t) => {
    const service = await fixture(t);
    const client = clientFor(t);
    function snapshot(id) {
      let favorite;
      function Probe() { favorite = service.useFavorite(id); return null; }
      renderToString(createElement(QueryClientProvider, { client }, createElement(Probe)));
      return favorite;
    }
    assert.equal(snapshot(25).saved, undefined);
    assert.equal(snapshot(25).loading, true);
    assert.equal(snapshot(25).disabled, true);
    service.control.fail = 'read';
    await assert.rejects(client.fetchQuery(service.favoritesQueryOptions));
    const failedRead = snapshot(25);
    assert.equal(failedRead.saved, undefined);
    assert.match(failedRead.error, /could not load/);
    assert.equal(failedRead.disabled, true);
    await client.fetchQuery(service.favoritesQueryOptions);
    assert.equal(snapshot(25).saved, false);
    const gate = { kind: 'write', entered: deferred(), release: deferred() };
    service.control.gate = gate;
    const save = service.saveFavorite(client, 25, true);
    await gate.entered.promise;
    assert.equal(snapshot(25).pending, true);
    assert.equal(snapshot(25).disabled, true);
    assert.equal(snapshot(25).saved, false);
    gate.release.resolve();
    await save;
    assert.equal(snapshot(25).saved, true);
    service.control.fail = 'write';
    await service.saveFavorite(client, 25, false);
    assert.equal(snapshot(25).saved, true);
    assert.match(snapshot(25).error, /could not be removed/);
    snapshot(25).retry();
    // Wait for the coordinator to publish the completed operation.
    await new Promise((resolve) => {
      const unsubscribe = client.getQueryCache().subscribe(() => {
        if (!client.getQueryData(service.favoriteWritesKey)[25]) { unsubscribe(); resolve(); }
      });
    });
    assert.equal(snapshot(25).saved, false);
    assert.equal(snapshot(25).error, undefined);
  });
}
