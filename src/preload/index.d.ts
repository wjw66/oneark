import type { OneArkAPI } from '../shared/contracts'

declare global {
  interface Window {
    oneark: OneArkAPI
  }
}
