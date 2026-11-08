import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export function createServer() {
  return {
    async handleRequest(request) {
      if (!request || typeof request !== 'object') {
        return {
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request' },
          id: null
        };
      }

      const { method, params, id } = request;

      if (method === 'initialize') {
        if (!params || typeof params !== 'object') {
          return {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: initialize requires parameters object' },
            id: id !== undefined ? id : null
          };
        }

        if (params.capabilities !== undefined && (params.capabilities === null || typeof params.capabilities !== 'object' || Array.isArray(params.capabilities))) {
          return {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: capabilities must be an object' },
            id: id !== undefined ? id : null
          };
        }

        if (params.clientInfo !== undefined && (params.clientInfo === null || typeof params.clientInfo !== 'object' || Array.isArray(params.clientInfo))) {
          return {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: clientInfo must be an object' },
            id: id !== undefined ? id : null
          };
        }

        return {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            serverInfo: {
              name: 'agentswarm-mcp',
              version: '1.0.0'
            }
          },
          id
        };
      }

      if (method === 'notifications/initialized') {
        return null;
      }

      return {
        jsonrpc: '2.0',
        error: { code: -32601, message: `Method not found: ${method}` },
        id
      };
    }
  };
}
