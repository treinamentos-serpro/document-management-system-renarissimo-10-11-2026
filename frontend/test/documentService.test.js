import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listDocuments, uploadDocument } from '../src/services/documentService.js';

test('listagem usa prefixo /api, identificação e sinal de cancelamento', async (context) => {
  const signal = new AbortController().signal;
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.headers['X-User-Id'], 'alice');
    assert.equal(options.signal, signal);
    return Response.json([]);
  });
  assert.deepEqual(await listDocuments('alice', signal), []);
});

test('upload envia FormData sem definir Content-Type manualmente', async (context) => {
  const file = new File(['abc'], 'teste.txt');
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('file').name, 'teste.txt');
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ id: '123' }, { status: 201 });
  });
  assert.deepEqual(await uploadDocument(file, 'alice'), { id: '123' });
});

test('erros da API e falhas de conexão são apresentados em português', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => Response.json({ error: { message: 'Arquivo muito grande.' } }, { status: 413 }));
  await assert.rejects(listDocuments('alice'), /Arquivo muito grande/);
  fetchMock.mock.mockImplementation(async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(listDocuments('alice'), /Não foi possível conectar ao servidor/);
});