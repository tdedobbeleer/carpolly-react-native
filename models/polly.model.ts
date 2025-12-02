import type { Driver } from './driver.model'

export interface Polly {
  id?: string
  description?: string
  drivers?: Driver[]
  created?: Date
}