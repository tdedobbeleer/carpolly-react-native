import type { Consumer } from './consumer.model'

export interface Driver {
  id?: string
  name?: string
  description?: string
  spots?: number
  consumers?: Consumer[]
}