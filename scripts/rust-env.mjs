import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'
import { spawnSync } from 'node:child_process'

export function rustEnv() {
  const env = { ...process.env }
  const cargoHome = env.CARGO_HOME || join(homedir(), '.cargo')
  const cargoBin = join(cargoHome, 'bin')
  if (existsSync(cargoBin)) env.PATH = `${cargoBin}${delimiter}${env.PATH || ''}`
  const check = spawnSync('cargo', ['--version'], { env, encoding: 'utf8' })
  if (check.status !== 0) {
    throw new Error('未找到 Rust/Cargo。请先按 README 安装 Rust 工具链，再运行此命令。')
  }
  return env
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
