declare module 'virtual:lab-interactions' {
  import type { ComponentType } from 'react'

  const modules: Record<string, { meta?: unknown; default?: ComponentType<{ variant?: string }> }>
  export default modules
}
