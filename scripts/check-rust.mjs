import { rustEnv, run } from './rust-env.mjs'

const env = rustEnv()
run('cargo', ['fmt', '--manifest-path', 'native/Cargo.toml', '--check'], { env })
run(
  'cargo',
  ['clippy', '--manifest-path', 'native/Cargo.toml', '--locked', '--', '-D', 'warnings'],
  {
    env
  }
)
