import type { Driver } from './driver.model'

export interface Polly {
  description?: string
  drivers?: Driver[]
  created?: Date
}