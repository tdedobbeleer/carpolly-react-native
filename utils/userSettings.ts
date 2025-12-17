import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = 'user_name';
const DRIVER_DESCRIPTION_KEY = 'driver_description';
const DRIVER_SPOTS_KEY = 'driver_spots';

export interface UserSettings {
  name: string;
  driverDescription: string;
  driverSpots: number;
}

export const getUserName = async (): Promise<string> => {
  try {
    const savedName = await AsyncStorage.getItem(USER_NAME_KEY);
    return savedName || '';
  } catch (error) {
    console.error('Error loading user name:', error);
    return '';
  }
};

export const saveUserName = async (name: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    return true;
  } catch (error) {
    console.error('Error saving user name:', error);
    return false;
  }
};

export const getDriverDescription = async (): Promise<string> => {
  try {
    const savedDescription = await AsyncStorage.getItem(DRIVER_DESCRIPTION_KEY);
    return savedDescription || '';
  } catch (error) {
    console.error('Error loading driver description:', error);
    return '';
  }
};

export const saveDriverDescription = async (description: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(DRIVER_DESCRIPTION_KEY, description);
    return true;
  } catch (error) {
    console.error('Error saving driver description:', error);
    return false;
  }
};

export const getDriverSpots = async (): Promise<number> => {
  try {
    const savedSpots = await AsyncStorage.getItem(DRIVER_SPOTS_KEY);
    return savedSpots ? parseInt(savedSpots, 10) : 1;
  } catch (error) {
    console.error('Error loading driver spots:', error);
    return 1;
  }
};

export const saveDriverSpots = async (spots: number): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(DRIVER_SPOTS_KEY, spots.toString());
    return true;
  } catch (error) {
    console.error('Error saving driver spots:', error);
    return false;
  }
};

export const getUserSettings = async (): Promise<UserSettings> => {
  const [name, driverDescription, driverSpots] = await Promise.all([
    getUserName(),
    getDriverDescription(),
    getDriverSpots(),
  ]);

  return {
    name,
    driverDescription,
    driverSpots,
  };
};

export const saveUserSettings = async (settings: Partial<UserSettings>): Promise<boolean> => {
  const promises: Promise<boolean>[] = [];

  if (settings.name !== undefined) {
    promises.push(saveUserName(settings.name));
  }

  if (settings.driverDescription !== undefined) {
    promises.push(saveDriverDescription(settings.driverDescription));
  }

  if (settings.driverSpots !== undefined) {
    promises.push(saveDriverSpots(settings.driverSpots));
  }

  const results = await Promise.all(promises);
  return results.every(result => result);
};