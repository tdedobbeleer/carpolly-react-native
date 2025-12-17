import AsyncStorage from '@react-native-async-storage/async-storage';
import MD5 from 'crypto-js/md5';
import type { Polly } from '../models/polly.model';

const POLLY_STATE_PREFIX = 'polly-state-';
const POLLY_HASH_PREFIX = 'polly-hash-';
const NOTIFICATION_SETTINGS_PREFIX = 'notification_settings_';

const getPollyStateKey = (pollyId: string) => `${POLLY_STATE_PREFIX}${pollyId}`;
const getPollyHashKey = (pollyId: string) => `${POLLY_HASH_PREFIX}${pollyId}`;

const computePollyHash = (pollyData: Polly): string => MD5(JSON.stringify(pollyData)).toString();

type StoredHash = { hash: string; timestamp: number };

const getStoredPollyHash = async (pollyId: string): Promise<StoredHash | null> => {
  try {
    const stored = await AsyncStorage.getItem(getPollyHashKey(pollyId));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<StoredHash>;
    if (!parsed || typeof parsed.hash !== 'string' || typeof parsed.timestamp !== 'number') return null;
    return { hash: parsed.hash, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
};

export const cleanupOldHashesAndSettings = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const oldKeys = keys.filter(
      key => key.startsWith(POLLY_HASH_PREFIX) || key.startsWith(NOTIFICATION_SETTINGS_PREFIX)
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
    console.error('Error cleaning up old hashes and settings:', error);
  }
};

// Helper function to update stored polly state for background notifications
export const updateStoredPollyState = async (pollyData: Polly, notificationsEnabled: boolean) => {
  if (!notificationsEnabled) return;

  const pollyId = pollyData.id;
  if (!pollyId) return;

  try {
    const stateKey = getPollyStateKey(pollyId);
    await AsyncStorage.setItem(stateKey, JSON.stringify(pollyData));
    console.log('[PollyDetailScreen] Updated stored polly state for background notifications');
  } catch (error) {
    console.error('[PollyDetailScreen] Error updating stored polly state:', error);
  }
};

// Helper function to save polly hash for update detection
export const savePollyHash = async (pollyData: Polly) => {
  const pollyId = pollyData.id;
  if (!pollyId) return;

  try {
    const hash = computePollyHash(pollyData);
    const stored = await getStoredPollyHash(pollyId);
    if (stored?.hash === hash) {
      return; // No change, skip save
    }
    await AsyncStorage.setItem(getPollyHashKey(pollyId), JSON.stringify({ hash, timestamp: Date.now() }));
  } catch (error) {
    console.error('[PollyDetailScreen] Error saving polly hash:', error);
  }
};

export const isPollyUpdated = async (pollyId: string, pollyData: Polly): Promise<boolean> => {
  const stored = await getStoredPollyHash(pollyId);
  if (!stored?.hash) return false;
  const currentHash = computePollyHash(pollyData);
  return stored.hash !== currentHash;
};