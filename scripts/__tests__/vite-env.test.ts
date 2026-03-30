// @vitest-environment node

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { hydrateProcessEnvFromVite } from '../vite-env'

const trackedKeys = [
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'VITE_CLERK_PUBLISHABLE_KEY',
] as const

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop()

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  }

  for (const key of trackedKeys) {
    delete process.env[key]
  }
})

describe('hydrateProcessEnvFromVite', () => {
  it('loads server-side env vars from .env.local into process.env', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lab-vite-env-'))
    tempDirs.push(tempDir)

    for (const key of trackedKeys) {
      delete process.env[key]
    }

    await fs.writeFile(path.join(tempDir, '.env.local'), [
      'VITE_CLERK_PUBLISHABLE_KEY=pk_live_client',
      'CLERK_PUBLISHABLE_KEY=pk_live_server',
      'CLERK_SECRET_KEY=sk_live_server',
      'DATABASE_URL=postgres://localhost/the-lab',
    ].join('\n'))

    const env = hydrateProcessEnvFromVite('development', tempDir)

    expect(env.CLERK_PUBLISHABLE_KEY).toBe('pk_live_server')
    expect(process.env.CLERK_PUBLISHABLE_KEY).toBe('pk_live_server')
    expect(process.env.CLERK_SECRET_KEY).toBe('sk_live_server')
    expect(process.env.DATABASE_URL).toBe('postgres://localhost/the-lab')
    expect(process.env.VITE_CLERK_PUBLISHABLE_KEY).toBe('pk_live_client')
  })
})
