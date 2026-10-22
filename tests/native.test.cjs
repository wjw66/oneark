const test = require('node:test')
const assert = require('node:assert/strict')
const native = require('../native/oneark-native.node')

test('原生模块可加载，返回当前系统而非模拟结果', () => {
  const info = native.getNativeInfo()
  assert.equal(info.version, require('../native/package.json').version)
  const platform = { darwin: 'macos', win32: 'windows' }[process.platform] || process.platform
  const architecture = { arm64: 'aarch64', x64: 'x86_64' }[process.arch] || process.arch
  assert.equal(info.platform, platform)
  assert.equal(info.architecture, architecture)
})
