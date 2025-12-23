import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Polly } from '../models/polly.model';

const POLLY_STATE_PREFIX = 'polly-state-';
const POLLY_TIMESTAMP_PREFIX = 'polly-timestamp-';
const NOTIFICATION_SETTINGS_PREFIX = 'notification_settings_';

const getPollyStateKey = (pollyId: string) => `${POLLY_STATE_PREFIX}${pollyId}`;
const getPollyTimestampKey = (pollyId: string) => `${POLLY_TIMESTAMP_PREFIX}${pollyId}`;

type StoredTimestamp = { updatedAt: string };

const getStoredPollyTimestamp = async (pollyId: string): Promise<StoredTimestamp | null> => {
  try {
    const stored = await AsyncStorage.getItem(getPollyTimestampKey(pollyId));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<StoredTimestamp>;
    if (!parsed || typeof parsed.updatedAt !== 'string') return null;
    return { updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
};

export const cleanupOldSettings = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const oldKeys = keys.filter(
      key => key.startsWith(NOTIFICATION_SETTINGS_PREFIX)
    );
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    for (const key of oldKeys) {
      const value = await AsyncStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value) as { timestamp?: number };
      if (typeof parsed.timestamp !== 'number') continue;
      if (now - parsed.timestamp > thirtyDays) {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old timestamps and settings:', error);
  }
};

// Helper function to update stored polly state for background notifications
export const updateStoredPollyState = async (pollyId: string, pollyData: Polly, notificationsEnabled: boolean) => {
  if (!notificationsEnabled) return;

  if (!pollyId) return;

  try {
    const stateKey = getPollyStateKey(pollyId);
    await AsyncStorage.setItem(stateKey, JSON.stringify(pollyData));
    console.log('[PollyDetailScreen] Updated stored polly state for background notifications');
  } catch (error) {
    console.error('[PollyDetailScreen] Error updating stored polly state:', error);
  }
};

// Helper function to save polly timestamp for update detection
export const savePollyTimestamp = async (pollyId: string, updatedAt: Date) => {
  if (!pollyId || !updatedAt) return;

  try {
    const updatedAtString = updatedAt.toISOString();
    const stored = await getStoredPollyTimestamp(pollyId);
    if (stored?.updatedAt === updatedAtString) {
      return; // No change, skip save
    }
    await AsyncStorage.setItem(getPollyTimestampKey(pollyId), JSON.stringify({ 
      updatedAt: updatedAtString
    }));
  } catch (error) {
    console.error('[PollyDetailScreen] Error saving polly timestamp:', error);
  }
};

export const isPollyUpdated = async (pollyId: string, updatedAt: Date | undefined): Promise<boolean> => {
  const stored = await getStoredPollyTimestamp(pollyId);
  if (!stored?.updatedAt || !updatedAt) return false;
  
  const currentUpdatedAt = updatedAt.toISOString();
  return stored.updatedAt !== currentUpdatedAt;
};