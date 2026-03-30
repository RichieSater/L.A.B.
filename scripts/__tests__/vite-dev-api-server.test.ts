// @vitest-environment node

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createServer } from 'vite'
import { viteDevApiPlugin } from '../vite-dev-api'

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop()

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  }
})

describe('viteDevApiPlugin', () => {
  it('executes API handlers and returns JSON instead of transformed source', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lab-vite-dev-api-'))
    tempDirs.push(root)

    await writeFixture(root, {
      'api/bootstrap.ts': [
        'export default async function handler(req, res) {',
        '  return res.status(200).json({ ok: true, method: req.method, query: req.query })',
        '}',
      ].join('\n'),
    })

    const server = await createServer({
      root,
      appType: 'custom',
      logLevel: 'error',
      plugins: [viteDevApiPlugin()],
      server: {
        host: '127.0.0.1',
        port: 0,
      },
    })

    try {
      await server.listen()

      const address = server.httpServer?.address()

      if (!address || typeof address === 'string') {
        throw new Error('Could not determine the Vite dev server port.')
      }

      const response = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap?hello=world`)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(body).toEqual({
        ok: true,
        method: 'GET',
        query: {
          hello: 'world',
        },
      })
    } finally {
      await server.close()
    }
  })
})

async function writeFixture(root: string, files: Record<string, string>): Promise<void> {
  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = path.join(root, relativePath)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, contents)
  }
}
