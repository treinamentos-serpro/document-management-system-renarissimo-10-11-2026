const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { mkdtemp, readdir, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { loadConfig } = require('../src/config');
const { createDocumentService } = require('../src/services/documents.service');
const { createDocumentRepository } = require('../src/repositories/documents.repository');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

async function setup(context, maxFileSize = 1024) {
  const storageDirectory = await mkdtemp(path.join(tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDirectory, maxFileSize }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
    await rm(storageDirectory, { recursive: true, force: true });
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    storageDirectory,
    request(route, options = {}, owner = 'alice') {
      return fetch(`${baseUrl}${route}`, {
        ...options,
        headers: owner === null ? {} : { 'X-User-Id': owner },
      });
    },
  };
}

function uploadBody(content = 'conteudo do documento', name = 'relatorio.txt') {
  const body = new FormData();
  body.append('file', new Blob([content]), name);
  return body;
}

test('upload, listagem e download preservam conteúdo e isolam usuários', async (context) => {
  const { request, storageDirectory } = await setup(context);
  assert.deepStrictEqual(await (await request('/health', {}, null)).json(), { status: 'ok' });
  assert.deepStrictEqual(await (await request('/documents')).json(), []);
  const response = await request('/upload', { method: 'POST', body: uploadBody() });
  assert.strictEqual(response.status, 201);
  const document = await response.json();
  assert.deepStrictEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.owner, 'alice');
  assert.strictEqual(document.size, Buffer.byteLength('conteudo do documento'));
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
  assert.deepStrictEqual(await (await request('/documents')).json(), [document]);
  assert.deepStrictEqual(await (await request('/documents', {}, 'bob')).json(), []);
  assert.strictEqual((await request(`/documents/${document.id}/download`, {}, 'bob')).status, 404);
  assert.strictEqual((await request('/documents/inexistente/download')).status, 404);
  const download = await request(`/documents/${document.id}/download`);
  assert.strictEqual(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment;.*relatorio\.txt/);
  assert.match(download.headers.get('content-type'), /application\/octet-stream/);
  assert.strictEqual(await download.text(), 'conteudo do documento');
  const [storageName] = await readdir(storageDirectory);
  assert.notStrictEqual(storageName, document.originalName);
  await rm(path.join(storageDirectory, storageName));
  assert.strictEqual((await request(`/documents/${document.id}/download`)).status, 404);
});

test('validação rejeita usuário ausente, arquivo ausente, vazio, excessivo e múltiplo sem resíduos', async (context) => {
  const { request, storageDirectory } = await setup(context, 16);
  assert.strictEqual((await request('/documents', {}, null)).status, 400);
  assert.strictEqual((await request('/upload', { method: 'POST', body: uploadBody('abc') }, null)).status, 400);
  assert.strictEqual((await request('/upload', { method: 'POST' })).status, 400);
  assert.strictEqual((await request('/upload', { method: 'POST', body: uploadBody('') })).status, 400);
  assert.strictEqual((await request('/upload', { method: 'POST', body: uploadBody('a'.repeat(17)) })).status, 413);
  const multiple = uploadBody('abc');
  multiple.append('file', new Blob(['def']), 'segundo.txt');
  assert.strictEqual((await request('/upload', { method: 'POST', body: multiple })).status, 400);
  const wrongField = new FormData();
  wrongField.append('document', new Blob(['abc']), 'arquivo.txt');
  assert.strictEqual((await request('/upload', { method: 'POST', body: wrongField })).status, 400);
  assert.deepStrictEqual(await readdir(storageDirectory), []);
  assert.deepStrictEqual(await (await request('/documents')).json(), []);
});

test('arquivos com o mesmo nome não colidem e listagem fica em ordem decrescente', async (context) => {
  const { request, storageDirectory } = await setup(context);
  const first = await (await request('/upload', { method: 'POST', body: uploadBody('primeiro') })).json();
  const second = await (await request('/upload', { method: 'POST', body: uploadBody('segundo') })).json();
  assert.notStrictEqual(first.id, second.id);
  assert.strictEqual((await readdir(storageDirectory)).length, 2);
  const documents = await (await request('/documents')).json();
  assert.deepStrictEqual(documents.map((document) => document.id), [second.id, first.id]);
});

test('falha no registro remove o arquivo recém-gravado', async () => {
  let removed;
  const service = createDocumentService({
    insert() { throw new Error('falha simulada'); },
    async removeFile(storageName) { removed = storageName; },
  });
  await assert.rejects(service.create({ size: 3, originalname: 'teste.txt', filename: 'interno' }, 'alice'), /falha simulada/);
  assert.strictEqual(removed, 'interno');
});

test('configuração rejeita limites e portas inválidos', () => {
  assert.strictEqual(loadConfig({}).maxFileSize, 10485760);
  for (const value of ['0', '-1', 'abc', '1.5', '']) {
    assert.throws(() => loadConfig({ MAX_FILE_SIZE_BYTES: value }));
  }
  assert.throws(() => loadConfig({ PORT: '65536' }));
});

test('download preserva bytes binários e nome com acentos', async (context) => {
  const { request } = await setup(context);
  const bytes = new Uint8Array([0, 255, 128, 13, 10, 42]);
  const body = new FormData();
  body.append('file', new Blob([bytes]), 'relatório.bin');
  const response = await request('/upload', { method: 'POST', body });
  assert.strictEqual(response.status, 201);
  const document = await response.json();
  assert.strictEqual(document.originalName, 'relatório.bin');
  const download = await request(`/documents/${document.id}/download`);
  assert.deepStrictEqual(new Uint8Array(await download.arrayBuffer()), bytes);
});

test('repositório desempata datas, bloqueia caminhos externos e não recupera metadados', async (context) => {
  const { storageDirectory } = await setup(context);
  const repository = createDocumentRepository(storageDirectory);
  const metadata = { owner: 'alice', uploadedAt: '2026-01-01T00:00:00.000Z', storageName: 'arquivo-local' };
  repository.insert({ ...metadata, id: 'primeiro' });
  repository.insert({ ...metadata, id: 'segundo' });
  assert.deepStrictEqual(repository.listByOwner('alice').map((document) => document.id), ['segundo', 'primeiro']);
  assert.throws(() => repository.getFilePath('../externo'));
  await writeFile(path.join(storageDirectory, metadata.storageName), 'arquivo');
  const restarted = createDocumentRepository(storageDirectory);
  assert.deepStrictEqual(restarted.listByOwner('alice'), []);
  assert.strictEqual(await restarted.fileExists(metadata.storageName), true);
});
