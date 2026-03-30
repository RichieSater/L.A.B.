import { loadEnv } from 'vite'

export function hydrateProcessEnvFromVite(mode: string, root = process.cwd()): Record<string, string> {
  const env = loadEnv(mode, root, '')

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return env
}
