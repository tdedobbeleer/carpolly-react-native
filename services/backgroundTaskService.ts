import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataService } from './dataService';
import { Notifications } from 'react-native-notifications';
import type { Polly } from '../models/polly.model';

const POLLY_MONITOR_TASK = 'polly-monitor-task';
const MONITORED_POLLIES_KEY = 'monitored-pollies';
const POLLY_STATE_KEY_PREFIX = 'polly-state-';

class BackgroundTaskService {
  private monitoredPollies: Set<string> = new Set();

  async init() {
    // Register the background fetch task
    TaskManager.defineTask(POLLY_MONITOR_TASK, this.monitorPollies.bind(this));

    // Load monitored pollies from storage
    const stored = await AsyncStorage.getItem(MONITORED_POLLIES_KEY);
    if (stored) {
      const pollies = JSON.parse(stored);
      this.monitoredPollies = new Set(pollies);
    }

    // Register background fetch if there are monitored pollies
    if (this.monitoredPollies.size > 0) {
      await BackgroundFetch.registerTaskAsync(POLLY_MONITOR_TASK, {
        minimumInterval: 60, // 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  }

  async startMonitoringPolly(pollyId: string) {
    this.monitoredPollies.add(pollyId);
    await this.saveMonitoredPollies();

    // Register background fetch if not already
    const isRegistered = await BackgroundFetch.getStatusAsync();
    if (isRegistered !== BackgroundFetch.BackgroundFetchStatus.Available) {
      await BackgroundFetch.registerTaskAsync(POLLY_MONITOR_TASK, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  }

  async stopMonitoringPolly(pollyId: string) {
    this.monitoredPollies.delete(pollyId);
    await this.saveMonitoredPollies();

    // Unregister if no more pollies
    if (this.monitoredPollies.size === 0) {
      try {
        await BackgroundFetch.unregisterTaskAsync(POLLY_MONITOR_TASK);
      } catch (error) {
        // Task may not be registered, ignore error
        console.log('Background task not registered or already unregistered');
      }
    }
  }

  private async monitorPollies() {
    try {
      for (const pollyId of this.monitoredPollies) {
        const polly = await dataService.getPolly(pollyId);
        if (polly) {
          const stateKey = POLLY_STATE_KEY_PREFIX + pollyId;
          const storedState = await AsyncStorage.getItem(stateKey);
          let previousPolly: Polly | null = null;
          if (storedState) {
            previousPolly = JSON.parse(storedState);
          }

          if (previousPolly) {
            const notifications = this.generateNotifications(previousPolly, polly);
            notifications.forEach((message) => {
              Notifications.postLocalNotification({
                identifier: `polly-${Date.now()}-${Math.random()}`,
                payload: {},
                title: 'CarPolly Update',
                body: message,
                sound: 'default',
                badge: 1,
                type: 'local',
                thread: 'polly-updates',
              });
            });
          }

          // Save current state
          await AsyncStorage.setItem(stateKey, JSON.stringify(polly));
        }
      }
    } catch (error) {
      console.error('Error in background polly monitoring:', error);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  }

  private async saveMonitoredPollies() {
    await AsyncStorage.setItem(MONITORED_POLLIES_KEY, JSON.stringify(Array.from(this.monitoredPollies)));
  }

  private generateNotifications(prev: Polly, current: Polly) {
    const messages: string[] = [];

    const prevDrivers = prev.drivers || [];
    const currentDrivers = current.drivers || [];

    // Check for added drivers
    const addedDrivers = currentDrivers.filter(cd => !prevDrivers.find(pd => pd.id === cd.id));
    addedDrivers.forEach(driver => {
      messages.push(`Driver "${driver.name}" joined the polly.`);
    });

    // Check for removed drivers
    const removedDrivers = prevDrivers.filter(pd => !currentDrivers.find(cd => cd.id === pd.id));
    removedDrivers.forEach(driver => {
      messages.push(`Driver "${driver.name}" left the polly.`);
    });

    // Check for changes in existing drivers
    currentDrivers.forEach(currentDriver => {
      const prevDriver = prevDrivers.find(pd => pd.id === currentDriver.id);
      if (prevDriver) {
        const prevConsumers = prevDriver.consumers || [];
        const currentConsumers = currentDriver.consumers || [];

        // Added consumers
        const addedConsumers = currentConsumers.filter(cc => !prevConsumers.find(pc => pc.id === cc.id));
        addedConsumers.forEach(consumer => {
          messages.push(`"${consumer.name}" joined "${currentDriver.name}"'s ride.`);
        });

        // Removed consumers
        const removedConsumers = prevConsumers.filter(pc => !currentConsumers.find(cc => cc.id === pc.id));
        removedConsumers.forEach(consumer => {
          messages.push(`"${consumer.name}" left "${currentDriver.name}"'s ride.`);
        });
      }
    });

    return messages;
  }
}

export const backgroundTaskService = new BackgroundTaskService();