import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataService } from './dataService';
import { Notifications } from 'react-native-notifications';
import type { Polly } from '../models/polly.model';

const POLLY_MONITOR_TASK = 'polly-monitor-task';
const MONITORED_POLLIES_KEY = 'monitored-pollies';
const POLLY_STATE_KEY_PREFIX = 'polly-state-';

type MonitoringConfig = {
  [pollyId: string]: true | string[]; // true = monitor whole polly, string[] = monitor specific drivers
};

class BackgroundTaskService {
  private monitoringConfig: MonitoringConfig = {};
  private isTaskRegistered: boolean = false;
  private isTaskDefined: boolean = false;

  async init() {
    console.log('[BackgroundTaskService] Initializing background task service');

    // Register the background task only once
    if (!this.isTaskDefined) {
      TaskManager.defineTask(POLLY_MONITOR_TASK, this.monitorPollies.bind(this));
      this.isTaskDefined = true;
      console.log('[BackgroundTaskService] Background task defined:', POLLY_MONITOR_TASK);
    } else {
      console.log('[BackgroundTaskService] Background task already defined, skipping');
    }

    // Load monitoring configuration from storage
    const stored = await AsyncStorage.getItem(MONITORED_POLLIES_KEY);
    if (stored) {
      this.monitoringConfig = JSON.parse(stored);
      const monitoredCount = Object.keys(this.monitoringConfig).length;
      console.log('[BackgroundTaskService] Loaded monitoring config for', monitoredCount, 'pollies:', this.monitoringConfig);
    } else {
      console.log('[BackgroundTaskService] No monitoring configuration found in storage');
    }

    // Register background task if there are monitored items
    const hasMonitoredItems = Object.keys(this.monitoringConfig).length > 0;
    if (hasMonitoredItems && !this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Registering background task with', Object.keys(this.monitoringConfig).length, 'monitored items');
      await BackgroundTask.registerTaskAsync(POLLY_MONITOR_TASK, {
        minimumInterval: 15, // 15 minutes
      });
      this.isTaskRegistered = true;
      console.log('[BackgroundTaskService] Background task registered successfully');
    } else if (hasMonitoredItems && this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Background task already registered, skipping registration');
    } else {
      console.log('[BackgroundTaskService] No monitored items, skipping background task registration');
    }
  }

  async startMonitoringPolly(pollyId: string) {
    console.log('[BackgroundTaskService] Starting monitoring for entire polly:', pollyId);

    const wasEmpty = Object.keys(this.monitoringConfig).length === 0;
    this.monitoringConfig[pollyId] = true; // Monitor entire polly
    console.log('[BackgroundTaskService] Added polly to monitoring config. Total monitored:', Object.keys(this.monitoringConfig).length);

    await this.saveMonitoringConfig();
    console.log('[BackgroundTaskService] Saved monitoring config to storage');

    // Register background task only if this is the first item and task not already registered
    if (wasEmpty && !this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Registering background task for first monitored item');
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
      console.log('[BackgroundTaskService] Not registering background task - either not first item or already registered');
    }
  }

  async startMonitoringDriver(pollyId: string, driverId: string) {
    console.log('[BackgroundTaskService] Starting monitoring for driver:', driverId, 'in polly:', pollyId);

    const wasEmpty = Object.keys(this.monitoringConfig).length === 0;
    const currentConfig = this.monitoringConfig[pollyId];

    if (currentConfig === true) {
      // Currently monitoring entire polly, need to switch to driver-specific
      // Get all drivers from current polly data
      const polly = await dataService.getPolly(pollyId);
      if (polly && polly.drivers) {
        this.monitoringConfig[pollyId] = polly.drivers.map(d => d.id!).filter(id => id !== driverId);
        this.monitoringConfig[pollyId].push(driverId);
      }
    } else if (Array.isArray(currentConfig)) {
      // Already monitoring specific drivers, add this one if not present
      if (!currentConfig.includes(driverId)) {
        currentConfig.push(driverId);
        this.monitoringConfig[pollyId] = currentConfig;
      }
    } else {
      // Not monitoring this polly yet, start with this driver
      this.monitoringConfig[pollyId] = [driverId];
    }

    console.log('[BackgroundTaskService] Updated monitoring config:', this.monitoringConfig[pollyId]);

    await this.saveMonitoringConfig();
    console.log('[BackgroundTaskService] Saved monitoring config to storage');

    // Register background task only if this is the first item and task not already registered
    if (wasEmpty && !this.isTaskRegistered) {
      console.log('[BackgroundTaskService] Registering background task for first monitored item');
      try {
        await BackgroundTask.registerTaskAsync(POLLY_MONITOR_TASK, {
          minimumInterval: 900, // 15 minutes
        });
        this.isTaskRegistered = true;
        console.log('[BackgroundTaskService] Background task registered successfully');
      } catch (error) {
        console.error('[BackgroundTaskService] Failed to register background task:', error);
      }
    }
  }

  async stopMonitoringDriver(pollyId: string, driverId: string) {
    console.log('[BackgroundTaskService] Stopping monitoring for driver:', driverId, 'in polly:', pollyId);

    const currentConfig = this.monitoringConfig[pollyId];
    if (Array.isArray(currentConfig)) {
      const updatedDrivers = currentConfig.filter(id => id !== driverId);
      if (updatedDrivers.length === 0) {
        // No more drivers to monitor for this polly
        delete this.monitoringConfig[pollyId];
      } else {
        this.monitoringConfig[pollyId] = updatedDrivers;
      }
    }

    console.log('[BackgroundTaskService] Updated monitoring config for polly:', pollyId, this.monitoringConfig[pollyId] || 'removed');

    await this.saveMonitoringConfig();
    console.log('[BackgroundTaskService] Saved monitoring config to storage');

    // Unregister if no more items to monitor
    const hasItems = Object.keys(this.monitoringConfig).length > 0;
    if (!hasItems && this.isTaskRegistered) {
      console.log('[BackgroundTaskService] No more monitored items, unregistering background task');
      try {
        await BackgroundTask.unregisterTaskAsync(POLLY_MONITOR_TASK);
        this.isTaskRegistered = false;
        console.log('[BackgroundTaskService] Background task unregistered successfully');
      } catch (error) {
        console.log('[BackgroundTaskService] Background task not registered or already unregistered:', error);
        this.isTaskRegistered = false;
      }
    }
  }

  async stopMonitoringPolly(pollyId: string) {
    console.log('[BackgroundTaskService] Stopping monitoring for polly:', pollyId);

    delete this.monitoringConfig[pollyId];
    console.log('[BackgroundTaskService] Removed polly from monitoring config. Remaining monitored:', Object.keys(this.monitoringConfig).length);

    await this.saveMonitoringConfig();
    console.log('[BackgroundTaskService] Saved updated monitoring config to storage');

    // Unregister if no more items to monitor
    const hasItems = Object.keys(this.monitoringConfig).length > 0;
    if (!hasItems && this.isTaskRegistered) {
      console.log('[BackgroundTaskService] No more monitored items, unregistering background task');
      try {
        await BackgroundTask.unregisterTaskAsync(POLLY_MONITOR_TASK);
        this.isTaskRegistered = false;
        console.log('[BackgroundTaskService] Background task unregistered successfully');
      } catch (error) {
        // Task may not be registered, ignore error
        console.log('[BackgroundTaskService] Background task not registered or already unregistered:', error);
        this.isTaskRegistered = false; // Reset flag on error
      }
    } else if (!hasItems) {
      console.log('[BackgroundTaskService] No more monitored items but task was not registered');
    } else {
      console.log('[BackgroundTaskService] Still have', Object.keys(this.monitoringConfig).length, 'monitored items, keeping background task registered');
    }
  }

  private async monitorPollies() {
    console.log('[BackgroundTaskService] Background task executed at:', new Date().toISOString());
    console.log('[BackgroundTaskService] Monitoring config:', this.monitoringConfig);

    try {
      for (const [pollyId, config] of Object.entries(this.monitoringConfig)) {
        console.log('[BackgroundTaskService] Checking polly:', pollyId, '- Config:', config);

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
            const notifications = this.generateNotifications(previousPolly, polly, config);
            console.log('[BackgroundTaskService] Generated', notifications.length, 'notifications for polly:', pollyId);

            // Save current state
            console.log('[BackgroundTaskService] Saving current state for polly:', pollyId);
            await AsyncStorage.setItem(stateKey, JSON.stringify(polly));

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
          } else {
            // Save current state even if no previous
            console.log('[BackgroundTaskService] Saving current state for polly:', pollyId);
            await AsyncStorage.setItem(stateKey, JSON.stringify(polly));
          }
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

  private async saveMonitoringConfig() {
    console.log('[BackgroundTaskService] Saving monitoring config to storage:', this.monitoringConfig);
    await AsyncStorage.setItem(MONITORED_POLLIES_KEY, JSON.stringify(this.monitoringConfig));
    console.log('[BackgroundTaskService] Successfully saved monitoring config to storage');
  }

  isMonitoringPolly(pollyId: string): boolean {
    return pollyId in this.monitoringConfig;
  }

  isMonitoringDriver(pollyId: string, driverId: string): boolean {
    const config = this.monitoringConfig[pollyId];
    return config === true || (Array.isArray(config) && config.includes(driverId));
  }

  getMonitoringConfig(pollyId: string): true | string[] | undefined {
    return this.monitoringConfig[pollyId];
  }

  private generateNotifications(prev: Polly, current: Polly, config: true | string[]) {
    const messages: string[] = [];

    const prevDrivers = prev.drivers || [];
    const currentDrivers = current.drivers || [];

    if (config === true) {
      // Monitor entire polly - check all changes
      console.log('[BackgroundTaskService] Monitoring entire polly');

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
    } else {
      // Monitor specific drivers only
      console.log('[BackgroundTaskService] Monitoring specific drivers:', config);

      config.forEach(driverId => {
        const prevDriver = prevDrivers.find(pd => pd.id === driverId);
        const currentDriver = currentDrivers.find(cd => cd.id === driverId);

        if (!prevDriver && currentDriver) {
          // Driver was added
          messages.push(`Driver "${currentDriver.name}" joined the polly.`);
        } else if (prevDriver && !currentDriver) {
          // Driver was removed
          messages.push(`Driver "${prevDriver.name}" left the polly.`);
        } else if (prevDriver && currentDriver) {
          // Driver exists in both, check consumer changes
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
    }

    return messages;
  }
}

export const backgroundTaskService = new BackgroundTaskService();