import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const shouldSkipForCi =
  process.env.CI === '1' ||
  process.env.CI === 'true' ||
  process.env.SKIP_GIT_HOOKS === '1'

if (shouldSkipForCi) {
  process.exit(0)
}

const gitCheck = spawnSync('git', ['--version'], {
  stdio: 'ignore',
})

if (gitCheck.error || gitCheck.status !== 0) {
  // Docker/CI images often do not include git, and hooks are not needed there.
  process.exit(0)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const lefthookBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'lefthook.cmd' : 'lefthook',
)

if (!existsSync(lefthookBin)) {
  process.exit(0)
}

const result = spawnSync(lefthookBin, ['install'], {
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 0)
