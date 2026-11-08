import { createServer } from './api.js';

const server = createServer();

const reader = process.stdin.getReader();
const decoder = new TextDecoder();
let buffer = '';

async function run() {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    let boundary;
    while ((boundary = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      
      if (!line) continue;
      
      try {
        const request = JSON.parse(line);
        const response = await server.handleRequest(request);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        const errorResponse = {
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error'
          },
          id: null
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    }
  }
}

run().catch(console.error);
