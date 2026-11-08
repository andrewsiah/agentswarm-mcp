import test from 'node:test';
import assert from 'node:assert';
import { createServer } from '../server/api.js';

test('initialize validates capabilities shape', async () => {
  const server = createServer();
  const res = await server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: null,
      clientInfo: { name: 'test', version: '1.0' }
    }
  });

  assert.strictEqual(res.error.code, -32602);
  assert.match(res.error.message, /capabilities must be an object/);
});

test('initialize validates clientInfo shape', async () => {
  const server = createServer();
  const res = await server.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: 'not-an-object'
    }
  });

  assert.strictEqual(res.error.code, -32602);
  assert.match(res.error.message, /clientInfo must be an object/);
});

test('initialize succeeds with valid params', async () => {
  const server = createServer();
  const res = await server.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    }
  });

  assert.deepStrictEqual(res.result.serverInfo, {
    name: 'agentswarm-mcp',
    version: '1.0.0'
  });
});
