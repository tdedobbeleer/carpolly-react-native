import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TextInput, FlatList, Share, Image, Platform, RefreshControl, AppState, AppStateStatus } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { backgroundTaskService } from '../services/backgroundTaskService';
import CustomText from '../components/CustomText';
import AddDriverModal from '../components/AddDriverModal';
import EditDriverModal from '../components/EditDriverModal';
import EditPollyModal from '../components/EditPollyModal';
import AddConsumerModal from '../components/AddConsumerModal';
import AlertModal from '../components/AlertModal';
import PassengersList from '../components/PassengersList';
import { useRoute, useNavigation } from '@react-navigation/native';
import { dataService } from '../services/dataService';
import { ValidationService } from '../services/validationService';
import { updateStoredPollyState, savePollyTimestamp } from '../utils/pollyUtils';
import { useFunnyMessages } from '../hooks/useFunnyMessages';
import { getUserSettings, UserSettings } from '../utils/userSettings';
import type { Polly } from '../models/polly.model';
import type { Driver } from '../models/driver.model';
import type { Consumer } from '../models/consumer.model';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  PollyDetail: { id: string };
  About: undefined;
  FAQ: undefined;
};

export default function PollyDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params as { id: string };
  const { getFunnyMessage } = useFunnyMessages();

  const [polly, setPolly] = useState<Polly | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAddConsumerModal, setShowAddConsumerModal] = useState(false);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(-1);
  const [showEditPollyModal, setShowEditPollyModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [expandedDrivers, setExpandedDrivers] = useState<{ [key: string]: boolean }>({});
  const [expandAll, setExpandAll] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showDriverNotificationsModal, setShowDriverNotificationsModal] = useState(false);
  const [selectedDriverForNotifications, setSelectedDriverForNotifications] = useState<Driver | null>(null);
  const [driverNotificationsEnabled, setDriverNotificationsEnabled] = useState<{ [driverId: string]: boolean }>({});
  const [previousPolly, setPreviousPolly] = useState<Polly | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [draggedConsumer, setDraggedConsumer] = useState<Consumer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingToDriver, setIsAddingToDriver] = useState(false);
  const [dragOverDriver, setDragOverDriver] = useState<string | null>(null);
  const [driverPositions, setDriverPositions] = useState<{ [driverId: string]: { x: number, y: number, width: number, height: number } }>({});
  const driverRefs = React.useRef<{ [driverId: string]: any }>({});
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    driverDescription: '',
    driverSpots: 1,
  });



  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    // Load notification settings when component mounts
    const loadNotificationSettings = async () => {
      try {
        const savedSettings = await dataService.loadNotificationSettings(id);
        setNotificationsEnabled(savedSettings);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    // Load user settings when component mounts
    const loadUserSettings = async () => {
      try {
        const settings = await getUserSettings();
        setUserSettings(settings);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadNotificationSettings();
    loadUserSettings();

    let unsubscribePromise: Promise<(() => void) | null> | undefined;

    if (appState === 'active') {
      unsubscribePromise = dataService.subscribeToPolly(id, (data) => {
        if (previousPolly && data) {
          const newNotifications = generateNotifications(previousPolly, data);
          if (notificationsEnabled) {
            newNotifications.forEach(async (message, index) => {
              await Notifications.scheduleNotificationAsync({
                identifier: `polly-${Date.now()}-${index}`,
                content: {
                  title: 'CarPolly Update',
                  body: message,
                  sound: 'default',
                  badge: 1,
                  data: {},
                  android: {
                    channelId: 'default',
                  },
                } as any,
                trigger: null,
              });
            });
          }
        }
        setPreviousPolly(data);
        setPolly(data);
        if (data) {
          updateStoredPollyState(id, data, notificationsEnabled);
          savePollyTimestamp(id, data.updatedAt!);
        }
        setIsLoading(false);
      });
    }

    return () => {
      if (unsubscribePromise) {
        unsubscribePromise.then(unsub => {
          if (unsub) unsub();
        }).catch((error: any) => {
          console.error('Error unsubscribing:', error);
        });
      }
    };
  }, [id, navigation, notificationsEnabled, appState]);

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerTitle: () => <Image source={require('../assets/logo.png')} style={{ width: 80, height: 80, resizeMode: 'contain' }} />,
      headerTitleAlign: 'center',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginLeft: 10 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => polly ? (
        <View style={{ flexDirection: 'row', marginRight: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={handleShare} style={{ marginRight: 15, padding: 5 }}>
            <Ionicons name="share-social" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={showNotifications} style={styles.notificationsButton}>
            <Ionicons name="notifications" size={24} color="black" />
            {notificationsEnabled && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>
      ) : null
    });
  }, [navigation, polly, notificationsEnabled]);

  // Expand all drivers by default when polly data is loaded
  useEffect(() => {
    if (polly?.drivers) {
      const newExpanded: { [key: string]: boolean } = {};
      const newDriverNotifications: { [driverId: string]: boolean } = {};
      (polly.drivers || []).forEach(driver => {
        if (driver.id) {
          newExpanded[driver.id] = true;
          newDriverNotifications[driver.id] = backgroundTaskService.isMonitoringDriver(id, driver.id);
        }
      });
      setExpandedDrivers(newExpanded);
      setDriverNotificationsEnabled(newDriverNotifications);
      setExpandAll(true);
      // Reset driver positions when drivers change
      setDriverPositions({});
    }
  }, [polly?.drivers, id]);

  // Add polly ID to previous pollys when screen loads (only once per polly ID)
  const processedPollyIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (id && !processedPollyIds.current.has(id)) {
      processedPollyIds.current.add(id);
      const addToPreviousPollys = async () => {
        try {
          const storedIds = await AsyncStorage.getItem('pollyIds');
          let pollyIds: string[] = [];
          if (storedIds) {
            pollyIds = JSON.parse(storedIds);
          }
          // Remove any existing duplicates first
          pollyIds = [...new Set(pollyIds)];
          if (!pollyIds.includes(id)) {
            pollyIds.push(id);
            console.log('[PollyDetailScreen] Adding polly to previous list:', id, '- Total pollys:', pollyIds.length);
            await AsyncStorage.setItem('pollyIds', JSON.stringify(pollyIds));
          } else {
            console.log('[PollyDetailScreen] Polly already in list:', id);
          }
        } catch (error) {
          console.error('[PollyDetailScreen] Error adding polly to previous list:', error);
        }
      };
      addToPreviousPollys();
    }
  }, [id]);


  const handleAddDriver = async (driver: Driver): Promise<boolean> => {
    if (!ValidationService.checkRateLimit('createDriver', 5, 60000)) {
      ValidationService.showRateLimitModal('create driver', 5, 60000);
      return false;
    }

    const result = await dataService.createDriver(id, driver);
    if (result !== null) {
      setShowAddDriverModal(false);
      return true;
    }
    return false;
  };

  const handleAddConsumer = async (consumer: Consumer): Promise<boolean> => {
    if (!ValidationService.checkRateLimit('addConsumer', 10, 60000)) {
      ValidationService.showRateLimitModal('add consumer', 10, 60000);
      return false;
    }

    if (polly?.drivers && selectedDriverIndex >= 0) {
      const driver = polly.drivers[selectedDriverIndex];
      if (driver.id) {
        const result = await dataService.createConsumer(id, driver.id, consumer);
        if (result !== null) {
          setShowAddConsumerModal(false);
          return true;
        }
      }
    }
    return false;
  };

  const handleDeleteDriver = async (driverId: string) => {
    setAlertTitle('Confirm Removal');
    setAlertMessage('Are you sure you want to remove this driver?');
    setAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await dataService.deleteDriver(id, driverId);
        }
      }
    ]);
    setAlertVisible(true);
  };

  const handleDeleteConsumer = async (driverId: string, consumerId: string) => {
    setAlertTitle('Confirm Removal');
    setAlertMessage('Are you sure you want to remove this passenger?');
    setAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await dataService.deleteConsumer(id, driverId, consumerId);
        }
      }
    ]);
    setAlertVisible(true);
  };

  const handleAddDanglingConsumer = async (consumer: Consumer): Promise<boolean> => {
    if (!ValidationService.checkRateLimit('addConsumer', 10, 60000)) {
      ValidationService.showRateLimitModal('add consumer', 10, 60000);
      return false;
    }

    const result = await dataService.createDanglingConsumer(id, consumer);
    if (result !== null) {
      setShowAddConsumerModal(false);
      return true;
    }
    return false;
  };

  const handleEnableNotifications = async (): Promise<void> => {
    try {
      await dataService.saveNotificationSettings(id, true);
      await backgroundTaskService.startMonitoringPolly(id);
      const polly = await dataService.getPolly(id);
      if (polly) {
        updateStoredPollyState(id, polly, true);
        savePollyTimestamp(id, polly.updatedAt!);
      }
      setNotificationsEnabled(true);
      Toast.show('Notifications enabled! You will now receive updates.', Toast.SHORT);
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Toast.show('Failed to enable notifications.', Toast.SHORT);
    }
  };

  const handleDeleteDanglingConsumer = async (consumerId: string) => {
    setAlertTitle('Confirm Removal');
    setAlertMessage('Are you sure you want to remove this passenger?');
    setAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await dataService.deleteDanglingConsumer(id, consumerId);
        }
      }
    ]);
    setAlertVisible(true);
  };

  const handleDragStart = (consumer: Consumer) => {
    console.log('Drag started for consumer:', consumer.name);
    setDraggedConsumer(consumer);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    console.log('Drag ended');
    setDragOverDriver(null);
    setDraggedConsumer(null);
    setIsDragging(false);
  };


  const handleDropOnDriver = async (driverId: string) => {
    const driver = polly?.drivers?.find(d => d.id === driverId);
    if (draggedConsumer?.id && driver && (driver.consumers?.length || 0) < (driver.spots || 0)) {
      await dataService.moveConsumerToDriver(id, draggedConsumer.id, driverId);
      setDraggedConsumer(null);
      setIsDragging(false);
      setDragOverDriver(null);
      Toast.show(`${draggedConsumer.name} joined ${driver.name}'s ride!`, Toast.SHORT);
    }
  };

  const openAddConsumerModal = (driverIndex: number) => {
    setSelectedDriverIndex(driverIndex);
    setIsAddingToDriver(true);
    setShowAddConsumerModal(true);
  };

  const openAddDanglingConsumerModal = () => {
    setIsAddingToDriver(false);
    setShowAddConsumerModal(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my CarPolly: carpolly://polly/${id}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleEditPolly = async (description: string): Promise<boolean> => {
    const result = await dataService.updatePolly(id, { description });
    if (result !== null) {
      setPolly(prev => {
        const updatedPolly = prev ? { ...prev, description } : null;
        if (updatedPolly) {
          updateStoredPollyState(id, updatedPolly, notificationsEnabled);
        }
        return updatedPolly;
      });
      setShowEditPollyModal(false);
      return true;
    }
    return false;
  };

  const openEditDriverModal = (driver: Driver) => {
    setEditingDriver(driver);
    setShowEditDriverModal(true);
  };

  const handleEditDriver = async (updatedDriver: Driver): Promise<boolean> => {
    if (!editingDriver) return false;

    const result = await dataService.updateDriver(id, editingDriver.id!, {
      name: updatedDriver.name,
      description: updatedDriver.description,
      spots: updatedDriver.spots
    });
    if (result !== null) {
      setShowEditDriverModal(false);
      return true;
    }
    return false;
  };

  const toggleComments = (consumerId: string) => {
    setExpandedComments(prev => ({ ...prev, [consumerId]: !prev[consumerId] }));
  };

  const toggleDriverExpansion = (driverId: string) => {
    setExpandedDrivers(prev => ({ ...prev, [driverId]: !prev[driverId] }));
  };

  const toggleExpandAll = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);
    const newExpanded: { [key: string]: boolean } = {};
    polly?.drivers?.forEach(driver => {
      if (driver.id) newExpanded[driver.id] = newExpandAll;
    });
    setExpandedDrivers(newExpanded);
  };

  const generateNotifications = (prev: Polly, current: Polly) => {
    const messages: string[] = [];

    // Check for polly description changes
    if (prev.description !== current.description) {
      messages.push(`Polly description updated.`);
    }

    const prevDrivers = prev.drivers || [];
    const currentDrivers = current.drivers || [];
    const prevConsumers = prev.consumers || [];
    const currentConsumers = current.consumers || [];

    // Check for added dangling consumers
    const addedConsumers = currentConsumers.filter(cc => !prevConsumers.find(pc => pc.id === cc.id));
    addedConsumers.forEach(consumer => {
      messages.push(`"${consumer.name}" joined the polly as a passenger.`);
    });

    // Check for removed dangling consumers
    const removedConsumers = prevConsumers.filter(pc => !currentConsumers.find(cc => pc.id === cc.id));
    removedConsumers.forEach(consumer => {
      messages.push(`"${consumer.name}" left the polly.`);
    });

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
  };

  const showNotifications = () => {
    setShowNotificationsModal(true);
  };

  const requestNotificationPermission = async () => {
    try {
      // Request notification permissions using Expo's API
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Show alert explaining that permissions are needed
        setAlertTitle('Notification Permissions Required');
        setAlertMessage('To receive updates about polly changes, please enable notifications in your device settings for this app.');
        setAlertButtons([
          {
            text: 'OK',
            style: 'default'
          }
        ]);
        setAlertVisible(true);
        return false;
      }

      return true;
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      // Show error message
      setAlertTitle('Permission Error');
      setAlertMessage('There was an error requesting notification permissions. Please try again or check your device settings.');
      setAlertButtons([{ text: 'OK', style: 'default' }]);
      setAlertVisible(true);
      return false;
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      // User wants to enable notifications, check permissions first
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        try {
          await dataService.saveNotificationSettings(id, true);
          // Start background task to monitor polly changes
          await backgroundTaskService.startMonitoringPolly(id);
          // Save current polly state for background task comparison
          const stateKey = 'polly-state-' + id;
          await AsyncStorage.setItem(stateKey, JSON.stringify(polly));
          setNotificationsEnabled(true);
          setShowNotificationsModal(false);
          // Use toast instead of Alert for this informational message
          Toast.show('Notifications enabled! You will now receive updates.', Toast.SHORT);
        } catch (error) {
          console.error('Error enabling notifications:', error);
          Toast.show('Failed to enable notifications.', Toast.SHORT);
        }
      }
    } else {
      // User wants to disable notifications
      try {
        await dataService.saveNotificationSettings(id, false);
        // Stop background task
        await backgroundTaskService.stopMonitoringPolly(id);
        setNotificationsEnabled(false);
        setShowNotificationsModal(false);
        // Use toast instead of Alert for this informational message
        Toast.show('Notifications disabled. You will no longer receive updates.', Toast.SHORT);
      } catch (error) {
        console.error('Error disabling notifications:', error);
        Toast.show('Failed to disable notifications.', Toast.SHORT);
      }
    }
  };

  const handleToggleDriverNotifications = async (driverId: string, value: boolean) => {
    if (value) {
      // User wants to enable driver notifications, check permissions first
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        try {
          await backgroundTaskService.startMonitoringDriver(id, driverId);
          setDriverNotificationsEnabled(prev => ({ ...prev, [driverId]: true }));
          Toast.show('Driver notifications enabled!', Toast.SHORT);
        } catch (error) {
          console.error('Error enabling driver notifications:', error);
          Toast.show('Failed to enable driver notifications.', Toast.SHORT);
        }
      }
    } else {
      // User wants to disable driver notifications
      try {
        await backgroundTaskService.stopMonitoringDriver(id, driverId);
        setDriverNotificationsEnabled(prev => ({ ...prev, [driverId]: false }));
        Toast.show('Driver notifications disabled.', Toast.SHORT);
      } catch (error) {
        console.error('Error disabling driver notifications:', error);
        Toast.show('Failed to disable driver notifications.', Toast.SHORT);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const freshPolly = await dataService.getPolly(id);
      setPolly(freshPolly);
      if (freshPolly) {
        updateStoredPollyState(id, freshPolly, notificationsEnabled);
        savePollyTimestamp(id, freshPolly.updatedAt!);
      }
    } catch (error) {
      console.error('Error refreshing polly:', error);
      Toast.show('Failed to refresh data.', Toast.SHORT);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomText>Loading...</CustomText>
      </View>
    );
  }

  if (!polly) {
    return (
      <LinearGradient
        colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.errorContainer}
      >
        <View style={styles.errorCard}>
          <CustomText style={styles.notFoundText}>Polly not found!</CustomText>
          <CustomText style={styles.errorSubtext}>The polly you're looking for doesn't exist or has been removed. How sad <Ionicons name="sad-outline"></Ionicons></CustomText>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.navigate('Home')}>
            <CustomText style={styles.goBackText}>Go Back</CustomText>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <FlatList
        data={[...(polly.drivers || [])].sort((a, b) => {
          const aAvailable = (a.spots || 0) - (a.consumers?.length || 0);
          const bAvailable = (b.spots || 0) - (b.consumers?.length || 0);
          return bAvailable - aAvailable; // Higher available spots first
        })}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.content}
        scrollEnabled={!isDragging}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} enabled={!isDragging} />
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity onPress={() => setShowEditPollyModal(true)} style={styles.titleContainer}>
              <CustomText type="h1" style={styles.title}>{polly.description}</CustomText>
            </TouchableOpacity>

            <PassengersList
              consumers={polly.consumers || []}
              expandedComments={expandedComments}
              draggedConsumer={draggedConsumer}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onToggleComments={toggleComments}
              onDeleteConsumer={handleDeleteDanglingConsumer}
              dragOverDriver={dragOverDriver}
              onDrop={handleDropOnDriver}
              driverPositions={driverPositions}
              onDragOver={setDragOverDriver}
            />

            <View style={styles.driversHeader}>
              <CustomText type="h2" style={styles.driversTitle}>Drivers and spots available</CustomText>
              <View style={styles.headerActions}>
                {(() => {
                  const noDrivers = !polly.drivers || polly.drivers.length === 0;
                  const allSpotsFilled = polly.drivers?.every(driver => (driver.consumers?.length || 0) >= (driver.spots || 0)) || false;
                  const showPassengerButton = noDrivers || allSpotsFilled;

                  return (
                    <>
                      <View style={styles.buttonGroup}>
                        {showPassengerButton && (
                          <TouchableOpacity
                            style={[styles.addPassengerButton, styles.buttonGroupLeft]}
                            onPress={openAddDanglingConsumerModal}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="person" size={16} color="black" />
                              <CustomText style={styles.addPassengerText}>I'm a passenger!</CustomText>
                            </View>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.addDriverButton,
                            showPassengerButton ? styles.buttonGroupRight : styles.buttonGroupSingle
                          ]}
                          onPress={() => setShowAddDriverModal(true)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="car" size={16} color="black" />
                            <CustomText style={styles.addDriverText}>I'm a driver!</CustomText>
                          </View>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.expandAllButton} onPress={toggleExpandAll}>
                        <CustomText style={styles.expandAllText}>{expandAll ? 'Collapse All' : 'Expand All'}</CustomText>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </View>

            {((polly.drivers || []).length === 0) && ((polly.consumers || []).length === 0) && (
              <View style={styles.noDriversCard}>
                <CustomText>No drivers yet.</CustomText>
                <CustomText>Use the share button to share this Polly with your friends or be a good parrot and offer a ride yourself 🦜</CustomText>
                <CustomText>You can also add yourself as a passenger and wait for drivers.</CustomText>
                <CustomText>Giddy up!</CustomText>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const isDropTarget = draggedConsumer && (item.consumers?.length || 0) < (item.spots || 0);
          const isDragOver = dragOverDriver === item.id;

          return (
            <View
              style={[
                styles.driverCard,
                isDropTarget && styles.dropTarget,
                isDragOver && styles.dragOverTarget
              ]}
              ref={(ref) => { if (ref) driverRefs.current[item.id!] = ref; }}
              onLayout={() => {
                if (driverRefs.current[item.id!]) {
                  driverRefs.current[item.id!].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                    setDriverPositions(prev => ({ ...prev, [item.id!]: { x: pageX, y: pageY, width, height } }));
                  });
                }
              }}
            >
              <TouchableOpacity onPress={() => openEditDriverModal(item)}>
                <View style={styles.driverHeader}>
                  <View style={styles.nameContainer}>
                    <CustomText type="h3" style={styles.driverName}>{item.name}</CustomText>
                  </View>
                  <View style={styles.headerRight}>
                    {!notificationsEnabled && (
                      <TouchableOpacity
                        style={styles.driverNotificationButton}
                        onPress={() => {
                          setSelectedDriverForNotifications(item);
                          setShowDriverNotificationsModal(true);
                        }}
                      >
                        <Ionicons name="notifications" size={20} color="black" />
                        {driverNotificationsEnabled[item.id!] && (
                          <View style={styles.driverNotificationBadge} />
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.progressContainer} onPress={() => toggleDriverExpansion(item.id!)}>
                      <Progress.Circle
                        size={40}
                        progress={(item.consumers?.length || 0) / (item.spots || 1)}
                        showsText
                        formatText={() => `${item.consumers?.length || 0}/${item.spots || 0}`}
                        textStyle={{ fontSize: 12 }}
                        color="#007bff"
                        unfilledColor="#e0e0e0"
                        borderWidth={0}
                      />
                      <Ionicons
                        name={expandedDrivers[item.id!] ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="black"
                        style={styles.arrowIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
              <CustomText style={styles.driverDescription}>Meeting details: {item.description}</CustomText>
              {expandedDrivers[item.id!] && (
                <>
                  <View style={styles.consumersList}>
                    {item.consumers && item.consumers.length > 0 ? (
                      item.consumers.map((consumer, consumerIndex) => (
                        <View key={consumer.id || consumerIndex}>
                          <View style={styles.consumerItem}>
                            <CustomText>{consumer.name}</CustomText>
                            <View style={styles.consumerActions}>
                              {consumer.comments && (
                                <TouchableOpacity onPress={() => toggleComments(consumer.id || consumerIndex.toString())}>
                                  <Ionicons name="chatbubble" size={16} color="black" />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                onPress={() => consumer.id && item.id && handleDeleteConsumer(item.id, consumer.id)}
                                style={styles.deleteButton}
                              >
                                <Ionicons name="trash" size={16} color="black" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          {expandedComments[consumer.id || consumerIndex.toString()] && consumer.comments && (
                            <View style={styles.commentContainer}>
                              <CustomText style={styles.commentText}>{consumer.comments}</CustomText>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <CustomText>No passengers yet 😔</CustomText>
                    )}
                     {(item.consumers?.length || 0) >= (item.spots || 0) && (
                       <CustomText style={styles.fullWarningText}>
                         Car is full! {getFunnyMessage(item.id!)}
                       </CustomText>
                     )}
                  </View>

                  <View style={styles.driverActions}>
                    <TouchableOpacity
                      style={[styles.joinButton, (item.consumers?.length || 0) >= (item.spots || 0) && styles.disabledButton]}
                      onPress={() => openAddConsumerModal(index)}
                      disabled={(item.consumers?.length || 0) >= (item.spots || 0)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person" size={16} color="black" />
                        <CustomText>I wanna join this ride!</CustomText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => item.id && handleDeleteDriver(item.id)}
                      style={styles.deleteDriverButton}
                    >
                      <CustomText style={styles.deleteDriverText}>Remove driver</CustomText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />

      <AddDriverModal
        visible={showAddDriverModal}
        onClose={() => setShowAddDriverModal(false)}
        onSubmit={handleAddDriver}
        defaultName={userSettings.name}
        defaultDescription={userSettings.driverDescription}
        defaultSpots={userSettings.driverSpots}
      />

      <AddConsumerModal
        visible={showAddConsumerModal}
        onClose={() => setShowAddConsumerModal(false)}
        onSubmit={isAddingToDriver ? handleAddConsumer : handleAddDanglingConsumer}
        isDanglingConsumer={!isAddingToDriver}
        onEnableNotifications={handleEnableNotifications}
        defaultName={userSettings.name}
      />

      <EditPollyModal
        visible={showEditPollyModal}
        description={polly?.description || ''}
        onClose={() => setShowEditPollyModal(false)}
        onSubmit={handleEditPolly}
      />

      <EditDriverModal
        visible={showEditDriverModal}
        driver={editingDriver}
        onClose={() => setShowEditDriverModal(false)}
        onSubmit={handleEditDriver}
      />

      {/* Notifications Modal */}
      <Modal visible={showNotificationsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomText type="h2" style={styles.modalTitle}><Ionicons name="notifications" size={24} color="#000" /> Notifications</CustomText>

            <View style={styles.notificationsInfo}>
              <CustomText style={styles.notificationsDescription}>
                Get notified when:
              </CustomText>
              <View style={styles.notificationsList}>
                <CustomText style={styles.notificationItem}>• New drivers join or leave the polly</CustomText>
                <CustomText style={styles.notificationItem}>• New passengers join or leave a ride</CustomText>
                <CustomText style={styles.notificationItem}>• The polly description is updated</CustomText>
              </View>
            </View>

            <View style={styles.modalActions}>
              {!notificationsEnabled ? (
                <TouchableOpacity
                  style={styles.enableDriverNotificationsButton}
                  onPress={() => handleToggleNotifications(true)}
                >
                  <CustomText style={styles.enableDriverNotificationsText}>Enable</CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.disableDriverNotificationsButton}
                  onPress={() => handleToggleNotifications(false)}
                >
                  <CustomText style={styles.disableDriverNotificationsText}>Disable</CustomText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNotificationsModal(false)}
              >
                <CustomText>Close</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Driver Notifications Modal */}
      <Modal visible={showDriverNotificationsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomText type="h2" style={styles.modalTitle}>
              <Ionicons name="notifications" size={24} color="#000" /> Driver Notifications
            </CustomText>

            {selectedDriverForNotifications && (
              <View style={styles.driverNotificationInfo}>
                <CustomText style={styles.driverNotificationDriverName}>
                  {selectedDriverForNotifications.name}
                </CustomText>
                <CustomText style={styles.notificationsDescription}>
                  Get notified when:
                </CustomText>
                <View style={styles.notificationsList}>
                  <CustomText style={styles.notificationItem}>• New passengers join or leave this driver's ride</CustomText>
                  <CustomText style={styles.notificationItem}>• This driver leaves the polly</CustomText>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              {selectedDriverForNotifications && !driverNotificationsEnabled[selectedDriverForNotifications.id!] ? (
                <TouchableOpacity
                  style={styles.enableDriverNotificationsButton}
                  onPress={() => {
                    handleToggleDriverNotifications(selectedDriverForNotifications.id!, true);
                    setShowDriverNotificationsModal(false);
                  }}
                >
                  <CustomText style={styles.enableDriverNotificationsText}>Enable</CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.disableDriverNotificationsButton}
                  onPress={() => {
                    handleToggleDriverNotifications(selectedDriverForNotifications!.id!, false);
                    setShowDriverNotificationsModal(false);
                  }}
                >
                  <CustomText style={styles.disableDriverNotificationsText}>Disable</CustomText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDriverNotificationsModal(false)}
              >
                <CustomText>Close</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onClose={() => setAlertVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#f8f9fa',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  notFoundText: {
    fontSize: 24,
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  goBackText: {
    color: '#000',
    fontSize: 16,
  },
  shareSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  driversHeader: {
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandAllButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  expandAllText: {
    color: '#000',
    fontSize: 14,
  },
  driversTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  addPassengerButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
    marginRight: 10,
  },
  addPassengerText: {
    color: '#000',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginRight: 10,
  },
  buttonGroupLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  buttonGroupRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: -15,
  },
  buttonGroupSingle: {
    borderRadius: 8,
  },
  addDriverButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  addDriverText: {
    color: '#000',
  },
  noDriversCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  driverCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 0,
  },
  dropTarget: {
    borderWidth: 2,
    borderColor: '#28a745',
    borderStyle: 'dashed',
  },
  dragOverTarget: {
    borderWidth: 3,
    borderColor: '#007bff',
    borderStyle: 'solid',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverNotificationButton: {
    position: 'relative',
    padding: 5,
    marginRight: 10,
  },
  driverNotificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    borderWidth: 1,
    borderColor: '#fff',
  },
  nameContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  arrowIcon: {
    marginLeft: 10,
  },
  driverName: {
    fontSize: 18,
  },
  driverDescription: {
    marginBottom: 10,
  },
  fullWarningText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  consumersList: {
    marginBottom: 15,
  },
  consumerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 5,
  },
  consumerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentContainer: {
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 4,
    marginLeft: 10,
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
  },
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  joinButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  deleteDriverButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc3545',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  deleteDriverText: {
    color: '#dc3545',
    fontSize: 14,
  },
  deleteButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Neucha_400Regular",
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  submitText: {
    color: '#000',
  },
  notificationsInfo: {
    marginBottom: 20,
  },
  notificationsDescription: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  notificationsList: {
    marginLeft: 10,
    marginBottom: 10,
  },
  notificationItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  },
  notificationsToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  notificationsButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    borderWidth: 1,
    borderColor: '#fff',
  },
  enableNotificationsButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  enableNotificationsText: {
    color: '#000',
    fontSize: 16,
  },
  disableNotificationsButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc3545',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  disableNotificationsText: {
    color: '#fff',
    fontSize: 16,
  },
  driverNotificationInfo: {
    marginBottom: 20,
  },
  driverNotificationDriverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  enableDriverNotificationsButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#28a745',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  enableDriverNotificationsText: {
    color: '#fff',
    fontSize: 16,
  },
  disableDriverNotificationsButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc3545',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  disableDriverNotificationsText: {
    color: '#fff',
    fontSize: 16,
  },
});