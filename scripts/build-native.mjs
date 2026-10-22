import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { rustEnv, run } from './rust-env.mjs'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cli = resolve(dirname(require.resolve('@napi-rs/cli/package.json')), 'dist/cli.js')

// 不把 .node 文件交给 Vite 打包，开发和发布均加载单独构建的原生模块。
run(process.execPath, [cli, 'build', '--release', '--no-js', '--', '--locked'], {
  cwd: resolve(root, 'native'),
  env: rustEnv()
})
