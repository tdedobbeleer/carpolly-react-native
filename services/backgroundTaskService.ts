import * as BackgroundTask from 'expo-background-task';
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
  private isTaskRegistered: boolean = false;

  async init() {
    console.log('[BackgroundTaskService] Initializing background task service');

    // Register the background task
    TaskManager.defineTask(POLLY_MONITOR_TASK, this.monitorPollies.bind(this));
    console.log('[BackgroundTaskService] Background task defined:', POLLY_MONITOR_TASK);

    // Load monitored pollies from storage
    const stored = await AsyncStorage.getItem(MONITORED_POLLIES_KEY);
    if (stored) {
      const pollies = JSON.parse(stored);
      this.monitoredPollies = new Set(pollies);
      console.log('[BackgroundTaskService] Loaded monitored pollies:', Array.from(this.monitoredPollies));
    } else {
      console.log('[BackgroundTaskService] No monitored pollies found in storage');
    }

    // Register background task if there are monitored pollies
    if (this.monitoredPollies.size > 0 && !this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Registering background task with', this.monitoredPollies.size, 'monitored pollies');
      await BackgroundTask.registerTaskAsync(POLLY_MONITOR_TASK, {
        minimumInterval: 15, // 15 minutes, which is the allowed minimum
      });
      this.isTaskRegistered = true;
      console.log('[BackgroundTaskService] Background task registered successfully');
    } else if (this.monitoredPollies.size > 0 && this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Background task already registered, skipping registration');
    } else {
      console.log('[BackgroundTaskService] No monitored pollies, skipping background task registration');
    }
  }

  async startMonitoringPolly(pollyId: string) {
    console.log('[BackgroundTaskService] Starting monitoring for polly:', pollyId);

    const wasEmpty = this.monitoredPollies.size === 0;
    this.monitoredPollies.add(pollyId);
    console.log('[BackgroundTaskService] Added polly to monitored set. Total monitored:', this.monitoredPollies.size);

    await this.saveMonitoredPollies();
    console.log('[BackgroundTaskService] Saved monitored pollies to storage');

    // Register background task only if this is the first polly and task not already registered
    if (wasEmpty && !this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Registering background task for first monitored polly');
      try {
        await BackgroundTask.registerTaskAsync(POLLY_MONITOR_TASK, {
          minimumInterval: 15, // 15 minutes
        });
        this.isTaskRegistered = true;
        console.log('[BackgroundTaskService] Background task registered successfully');
      } catch (error) {
        console.error('[BackgroundTaskService] Failed to register background task:', error);
      }
    } else if (this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Background task already registered, no need to register again');
    } else {
      console.log('[BackgroundTaskService] Not registering background task - either not first polly or already registered');
    }
  }

  async stopMonitoringPolly(pollyId: string) {
    console.log('[BackgroundTaskService] Stopping monitoring for polly:', pollyId);

    this.monitoredPollies.delete(pollyId);
    console.log('[BackgroundTaskService] Removed polly from monitored set. Remaining monitored:', this.monitoredPollies.size);

    await this.saveMonitoredPollies();
    console.log('[BackgroundTaskService] Saved updated monitored pollies to storage');

    // Unregister if no more pollies
    if (this.monitoredPollies.size === 0 && this.isTaskRegistered) {
      console.log('[BackgroundTaskService] No more monitored pollies, unregistering background task');
      try {
        await BackgroundTask.unregisterTaskAsync(POLLY_MONITOR_TASK);
        this.isTaskRegistered = false;
        console.log('[BackgroundTaskService] Background task unregistered successfully');
      } catch (error) {
        // Task may not be registered, ignore error
        console.log('[BackgroundTaskService] Background task not registered or already unregistered:', error);
        this.isTaskRegistered = false; // Reset flag on error
      }
    } else if (this.monitoredPollies.size === 0) {
      console.log('[BackgroundTaskService] No more monitored pollies but task was not registered');
    } else {
      console.log('[BackgroundTaskService] Still have', this.monitoredPollies.size, 'monitored pollies, keeping background task registered');
    }
  }

  private async monitorPollies() {
    console.log('[BackgroundTaskService] Background task executed at:', new Date().toISOString());
    console.log('[BackgroundTaskService] Monitoring', this.monitoredPollies.size, 'pollies:', Array.from(this.monitoredPollies));

    try {
      for (const pollyId of this.monitoredPollies) {
        console.log('[BackgroundTaskService] Checking polly:', pollyId);

        const polly = await dataService.getPolly(pollyId);
        if (polly) {
          console.log('[BackgroundTaskService] Retrieved polly data for:', pollyId, '- Description:', polly.description);

          const stateKey = POLLY_STATE_KEY_PREFIX + pollyId;
          const storedState = await AsyncStorage.getItem(stateKey);
          let previousPolly: Polly | null = null;

          if (storedState) {
            previousPolly = JSON.parse(storedState);
            console.log('[BackgroundTaskService] Found previous state for polly:', pollyId);
          } else {
            console.log('[BackgroundTaskService] No previous state found for polly:', pollyId, '- this is the first check');
          }

          if (previousPolly) {
            const notifications = this.generateNotifications(previousPolly, polly);
            console.log('[BackgroundTaskService] Generated', notifications.length, 'notifications for polly:', pollyId);

            if (notifications.length > 0) {
              console.log('[BackgroundTaskService] Posting notifications:', notifications);
              notifications.forEach((message, index) => {
                const notificationId = `polly-${Date.now()}-${Math.random()}`;
                console.log('[BackgroundTaskService] Posting notification:', notificationId, '- Message:', message);

                Notifications.postLocalNotification({
                  identifier: notificationId,
                  payload: {},
                  title: 'CarPolly Update',
                  body: message,
                  sound: 'default',
                  badge: 1,
                  type: 'local',
                  thread: 'polly-updates',
                });
              });
            } else {
              console.log('[BackgroundTaskService] No changes detected for polly:', pollyId);
            }
          }

          // Save current state
          console.log('[BackgroundTaskService] Saving current state for polly:', pollyId);
          await AsyncStorage.setItem(stateKey, JSON.stringify(polly));
        } else {
          console.log('[BackgroundTaskService] Failed to retrieve polly data for:', pollyId);
        }
      }

      console.log('[BackgroundTaskService] Background task completed successfully');
    } catch (error) {
      console.error('[BackgroundTaskService] Error in background polly monitoring:', error);
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  }

  private async saveMonitoredPollies() {
    const polliesArray = Array.from(this.monitoredPollies);
    console.log('[BackgroundTaskService] Saving monitored pollies to storage:', polliesArray);
    await AsyncStorage.setItem(MONITORED_POLLIES_KEY, JSON.stringify(polliesArray));
    console.log('[BackgroundTaskService] Successfully saved monitored pollies to storage');
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