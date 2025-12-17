import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc
} from '@react-native-firebase/firestore'
import { db } from '../firebase'
import { ValidationService } from './validationService'
import { errorService } from './errorService'
import type { Polly } from '../models/polly.model'
import type { Driver } from '../models/driver.model'
import type { Consumer } from '../models/consumer.model'

class DataService {
  private pollyCollection = 'pollies'

  private sortByGuid<T extends { id?: string; guid?: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const aKey = (a.guid ?? a.id ?? '').toString()
      const bKey = (b.guid ?? b.id ?? '').toString()
      return aKey.localeCompare(bKey)
    })
  }

  private normalizePollyCollections(polly: Polly): Polly {
    const drivers = this.sortByGuid(polly.drivers ?? []).map((driver: any) => ({
      ...driver,
      consumers: this.sortByGuid(driver.consumers ?? [])
    }))

    const consumers = this.sortByGuid(polly.consumers ?? [])

    return {
      ...polly,
      drivers,
      consumers
    }
  }

  async createPolly(id: string, polly: Polly) {
    // Validate UUID format
    const uuidValidation = ValidationService.validateUUID(id)
    if (!uuidValidation.isValid) {
      throw new Error('Invalid Polly ID format')
    }

    // Validate polly data
    if (!polly.description) {
      throw new Error('Polly description is required')
    }
    const descValidation = ValidationService.validatePollyDescription(polly.description)
    if (!descValidation.isValid) {
      throw new Error(descValidation.error)
    }

    return await errorService.withErrorHandling(async () => {
      const docRef = doc(db, this.pollyCollection, id)
      const { drivers, consumers, ...pollyData } = polly
      const data = { ...pollyData, created: serverTimestamp() }
      await setDoc(docRef, data)

      if (consumers && consumers.length > 0) {
        const consumersCollection = docRef.collection('consumers')
        for (const consumer of consumers) {
          await consumersCollection.add(consumer)
        }
      }

      if (drivers && drivers.length > 0) {
        const driversCollection = docRef.collection('drivers')
        for (const driver of drivers) {
          const { consumers, ...driverData } = driver
          const driverDocRef = await driversCollection.add(driverData)

          if (consumers && consumers.length > 0) {
            const consumersCollection = driverDocRef.collection('consumers')
            for (const consumer of consumers) {
              await consumersCollection.add(consumer)
            }
          }
        }
      }
      return true;
    }, { operation: 'create', entity: 'polly' }, false) // Don't show toast here, let the caller handle it
  }

  async getPolly(id: string) {
    return await errorService.withErrorHandling(async () => {
      const docRef = doc(db, this.pollyCollection, id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data() as any
        const driversCollection = collection(docRef, 'drivers')
        const driversSnap = await getDocs(driversCollection)
        const drivers = await Promise.all(driversSnap.docs.map(async (driverDoc: any) => {
          const consumersCollection = collection(driverDoc.ref, 'consumers')
          const consumersSnap = await getDocs(consumersCollection)
          const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() }))
          return { id: driverDoc.id, ...driverDoc.data(), consumers } as Driver
        }))

        const consumersCollection = collection(docRef, 'consumers')
        const consumersSnap = await getDocs(consumersCollection)
        const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() }))

        return this.normalizePollyCollections({ ...data, created: data.created?.toDate(), drivers, consumers } as Polly)
      } else {
        throw new Error('Polly not found')
      }
    }, { operation: 'fetch', entity: 'polly' }, false) // Don't show toast here, let the caller handle it
  }

  async getPollyFromServer(id: string) {
    return await errorService.withErrorHandling(async () => {
      const docRef = doc(db, this.pollyCollection, id)
      const docSnap = await getDocFromServer(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data() as any
        const driversCollection = collection(docRef, 'drivers')
        const driversSnap = await getDocs(driversCollection)
        const drivers = (await Promise.all(driversSnap.docs.map(async (driverDoc: any) => {
          const consumersCollection = collection(driverDoc.ref, 'consumers')
          const consumersSnap = await getDocs(consumersCollection)
          const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() })).sort((a: any, b: any) => a.id.localeCompare(b.id))
          return { id: driverDoc.id, ...driverDoc.data(), consumers } as Driver
        }))).sort((a: any, b: any) => a.id.localeCompare(b.id))

        const consumersCollection = collection(docRef, 'consumers')
        const consumersSnap = await getDocs(consumersCollection)
        const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() })).sort((a: any, b: any) => a.id.localeCompare(b.id))

        return this.normalizePollyCollections({ ...data, created: data.created?.toDate(), drivers, consumers } as Polly)
      } else {
        return null
      }
    }, { operation: 'fetch from server', entity: 'polly' }, false) // Don't show toast here, let the caller handle it
  }

  async updatePolly(id: string, polly: Partial<Polly>) {
    return await errorService.withErrorHandling(async () => {
      const docRef = doc(db, this.pollyCollection, id)
      const pollyData = { ...polly }
      delete pollyData.drivers
      if (Object.keys(pollyData).length > 0) {
        await updateDoc(docRef, pollyData)
      }
      return true;
    }, { operation: 'update', entity: 'polly' }, true) // Show toast for user feedback
  }

  async createDriver(pollyId: string, driver: Driver) {
    return await errorService.withErrorHandling(async () => {
      // Validate inputs
      const uuidValidation = ValidationService.validateUUID(pollyId)
      if (!uuidValidation.isValid) {
        throw new Error('Invalid Polly ID format')
      }

      if (!driver.name || !driver.description || typeof driver.spots !== 'number') {
        throw new Error('Driver name, description, and spots are required')
      }
      const driverValidation = ValidationService.validateDriverForm(driver.name, driver.description, driver.spots)
      if (!driverValidation.isValid) {
        throw new Error(Object.values(driverValidation.errors).join(', '))
      }

      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const driversCollection = collection(pollyDocRef, 'drivers')
      const { consumers, ...driverData } = driver
      const driverDocRef = await addDoc(driversCollection, driverData)

      if (consumers && consumers.length > 0) {
        for (const consumer of consumers) {
          await this.createConsumer(pollyId, driverDocRef.id, consumer)
        }
      }

      return driverDocRef.id
    }, { operation: 'create', entity: 'driver' }, true) // Show toast for user feedback
  }

  async updateDriver(pollyId: string, driverId: string, driver: Partial<Driver>) {
    return await errorService.withErrorHandling(async () => {
      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
      const driverData = { ...driver }
      delete driverData.consumers
      await updateDoc(driverDocRef, driverData)

      // Update driver timestamp to trigger subscription
      await updateDoc(driverDocRef, { lastUpdated: serverTimestamp() })
      return true;
    }, { operation: 'update', entity: 'driver' }, true) // Show toast for user feedback
  }

  async deleteDriver(pollyId: string, driverId: string) {
    return await errorService.withErrorHandling(async () => {
      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
      await deleteDoc(driverDocRef)
      return true;
    }, { operation: 'delete', entity: 'driver' }, true) // Show toast for user feedback
  }

  async createConsumer(pollyId: string, driverId: string, consumer: Consumer) {
    return await errorService.withErrorHandling(async () => {
      // Validate inputs
      const pollyUuidValidation = ValidationService.validateUUID(pollyId)
      if (!pollyUuidValidation.isValid) {
        throw new Error('Invalid Polly ID format')
      }

      if (!consumer.name) {
        throw new Error('Consumer name is required')
      }
      const consumerValidation = ValidationService.validateConsumerForm(consumer.name, consumer.comments || '')
      if (!consumerValidation.isValid) {
        throw new Error(Object.values(consumerValidation.errors).join(', '))
      }

      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
      const consumersCollection = collection(driverDocRef, 'consumers')
      const data: any = { name: consumer.name };
      if (consumer.comments) data.comments = consumer.comments;
      const consumerDocRef = await addDoc(consumersCollection, data)
      return consumerDocRef.id
    }, { operation: 'create', entity: 'passenger' }, true) // Show toast for user feedback
  }

  async updateConsumer(pollyId: string, driverId: string, consumerId: string, consumer: Partial<Consumer>) {
    return await errorService.withErrorHandling(async () => {
      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
      const consumerDocRef = doc(collection(driverDocRef, 'consumers'), consumerId)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...consumerData } = consumer
      await updateDoc(consumerDocRef, consumerData)
      return true;
    }, { operation: 'update', entity: 'passenger' }, true) // Show toast for user feedback
  }

  async deleteConsumer(pollyId: string, driverId: string, consumerId: string) {
    return await errorService.withErrorHandling(async () => {
      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
      const consumerDocRef = doc(collection(driverDocRef, 'consumers'), consumerId)
      await deleteDoc(consumerDocRef)
      return true;
    }, { operation: 'delete', entity: 'passenger' }, true) // Show toast for user feedback
  }

  async createDanglingConsumer(pollyId: string, consumer: Consumer) {
    return await errorService.withErrorHandling(async () => {
      // Validate inputs
      const pollyUuidValidation = ValidationService.validateUUID(pollyId)
      if (!pollyUuidValidation.isValid) {
        throw new Error('Invalid Polly ID format')
      }

      if (!consumer.name) {
        throw new Error('Consumer name is required')
      }
      const consumerValidation = ValidationService.validateConsumerForm(consumer.name, consumer.comments || '')
      if (!consumerValidation.isValid) {
        throw new Error(Object.values(consumerValidation.errors).join(', '))
      }

      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const consumersCollection = collection(pollyDocRef, 'consumers')
      const data: any = { name: consumer.name };
      if (consumer.comments) data.comments = consumer.comments;
      const consumerDocRef = await addDoc(consumersCollection, data)
      return consumerDocRef.id
    }, { operation: 'create', entity: 'passenger' }, true) // Show toast for user feedback
  }

  async deleteDanglingConsumer(pollyId: string, consumerId: string) {
    return await errorService.withErrorHandling(async () => {
      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const consumerDocRef = doc(collection(pollyDocRef, 'consumers'), consumerId)
      await deleteDoc(consumerDocRef)
      return true;
    }, { operation: 'delete', entity: 'passenger' }, true) // Show toast for user feedback
  }

  async moveConsumerToDriver(pollyId: string, consumerId: string, driverId: string) {
    return await errorService.withErrorHandling(async () => {
      // First get the consumer data
      const pollyDocRef = doc(db, this.pollyCollection, pollyId)
      const consumerDocRef = doc(collection(pollyDocRef, 'consumers'), consumerId)
      const consumerSnap = await getDoc(consumerDocRef)

      if (!consumerSnap.exists()) {
        throw new Error('Consumer not found')
      }

      const consumerData = consumerSnap.data()

      // Create consumer in driver
      const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
      const consumersCollection = collection(driverDocRef, 'consumers')
      await addDoc(consumersCollection, consumerData)

      // Delete dangling consumer
      await deleteDoc(consumerDocRef)

      return true;
    }, { operation: 'move', entity: 'passenger' }, true) // Show toast for user feedback
  }

  subscribeToPolly(id: string, callback: (polly: Polly | null) => void) {
    return errorService.withErrorHandling(async () => {
      const docRef = doc(db, this.pollyCollection, id)
      const driversCollection = collection(docRef, 'drivers')
      const consumersCollection = collection(docRef, 'consumers')

      const fetchAndCallback = async () => {
        try {
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            const driversSnap = await getDocs(driversCollection)
            const drivers = (await Promise.all(driversSnap.docs.map(async (driverDoc: any) => {
              const consumersCollection = collection(driverDoc.ref, 'consumers')
              const consumersSnap = await getDocs(consumersCollection)
              const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() })).sort((a: any, b: any) => a.id.localeCompare(b.id))
              return { id: driverDoc.id, ...driverDoc.data(), consumers } as Driver
            }))).sort((a: any, b: any) => a.id.localeCompare(b.id))

            const consumersSnap = await getDocs(consumersCollection)
            const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() })).sort((a: any, b: any) => a.id.localeCompare(b.id))

            callback(this.normalizePollyCollections({ ...(data as any), created: (data as any)?.created?.toDate(), drivers, consumers } as Polly))
          } else {
            callback(null)
          }
        } catch (error) {
          console.error('Error in subscribeToPolly:', error)
          // Don't show toast for subscription errors as they can be noisy
        }
      }

      // Listen to changes in the polly document
      const unsubscribePolly = onSnapshot(docRef, () => {
        fetchAndCallback()
      })

      // Listen to changes in the drivers collection
      const unsubscribeDrivers = onSnapshot(driversCollection, () => {
        fetchAndCallback()
      })

      // Listen to changes in dangling consumers collection
      const unsubscribeDanglingConsumers = onSnapshot(consumersCollection, () => {
        fetchAndCallback()
      })

      // Listen to changes in consumers for each driver
      const unsubscribeConsumers: (() => void)[] = []
      const unsubscribeDriversSnap = onSnapshot(driversCollection, (driversSnap: any) => {
        // Clean up previous consumer listeners
        unsubscribeConsumers.forEach(unsub => unsub())
        unsubscribeConsumers.length = 0

        driversSnap.docs.forEach((driverDoc: any) => {
          const consumersCollection = collection(driverDoc.ref, 'consumers')
          const unsubConsumer = onSnapshot(consumersCollection, () => {
            fetchAndCallback()
          })
          unsubscribeConsumers.push(unsubConsumer)
        })
      })

      return () => {
        unsubscribePolly()
        unsubscribeDrivers()
        unsubscribeDanglingConsumers()
        unsubscribeDriversSnap()
        unsubscribeConsumers.forEach(unsub => unsub())
      }
    }, { operation: 'subscribe to', entity: 'polly' }, false) // Don't show toast for subscription errors
  }

  subscribeToPollies(callback: (pollies: Polly[]) => void) {
    return errorService.withErrorHandling(async () => {
      const polliesCollection = collection(db, this.pollyCollection)

      const unsubscribe = onSnapshot(polliesCollection, async (polliesSnap: any) => {
        try {
          const pollies = await Promise.all(polliesSnap.docs.map(async (pollyDoc: any) => {
            const data = pollyDoc.data()
            const driversCollection = collection(pollyDoc.ref, 'drivers')
            const driversSnap = await getDocs(driversCollection)
            const drivers = await Promise.all(driversSnap.docs.map(async (driverDoc: any) => {
              const consumersCollection = collection(driverDoc.ref, 'consumers')
              const consumersSnap = await getDocs(consumersCollection)
              const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() }))
              return { id: driverDoc.id, ...driverDoc.data(), consumers } as Driver
            }))

            const consumersCollection = collection(pollyDoc.ref, 'consumers')
            const consumersSnap = await getDocs(consumersCollection)
            const consumers = consumersSnap.docs.map((consumerDoc: any) => ({ id: consumerDoc.id, ...consumerDoc.data() }))

            return this.normalizePollyCollections({ id: pollyDoc.id, ...data, created: data?.created?.toDate(), drivers, consumers } as Polly)
          }))
          callback(pollies)
        } catch (error) {
          console.error('Error in subscribeToPollies:', error)
          // Don't show toast for subscription errors as they can be noisy
        }
      })

      return unsubscribe
    }, { operation: 'subscribe to', entity: 'pollies' }, false) // Don't show toast for subscription errors
  }

  // Notification settings persistence methods
  private getNotificationStorageKey(pollyId: string): string {
    return `notification_settings_${pollyId}`
  }

  async saveNotificationSettings(pollyId: string, enabled: boolean): Promise<boolean> {
    const result = await errorService.withErrorHandling(async () => {
      const storageKey = this.getNotificationStorageKey(pollyId)
      await AsyncStorage.setItem(storageKey, JSON.stringify({ enabled, timestamp: Date.now() }))
      return true
    }, { operation: 'save', entity: 'notification settings' }, false)
    return result !== null
  }

  async loadNotificationSettings(pollyId: string): Promise<boolean> {
    const result = await errorService.withErrorHandling(async () => {
      const storageKey = this.getNotificationStorageKey(pollyId)
      const storedSettings = await AsyncStorage.getItem(storageKey)
      if (storedSettings) {
        try {
          const { enabled, timestamp } = JSON.parse(storedSettings)
          const now = Date.now()
          const thirtyDays = 30 * 24 * 60 * 60 * 1000
          if (now - timestamp > thirtyDays) {
            // Remove expired settings
            await AsyncStorage.removeItem(storageKey)
            return false
          }
          return enabled || false
        } catch (error) {
          console.error('Error parsing notification settings:', error)
          return false
        }
      }
      return false
    }, { operation: 'load', entity: 'notification settings' }, false)
    return result || false
  }
}

export const dataService = new DataService()