import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, Image, TouchableOpacity, View } from 'react-native';
import { NavigationContainer, DrawerActions, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Neucha_400Regular } from '@expo-google-fonts/neucha';
import { CabinSketch_400Regular } from '@expo-google-fonts/cabin-sketch';
import * as Linking from 'expo-linking';
import { useNetworkState } from 'expo-network';
import { backgroundTaskService } from './services/backgroundTaskService';
// React Native Firebase initializes automatically
import CustomText from './components/CustomText';
import HomeScreen from './screens/HomeScreen';
import PollyDetailScreen from './screens/PollyDetailScreen';
import AboutScreen from './screens/AboutScreen';
import FAQScreen from './screens/FAQScreen';
import SettingsScreen from './screens/SettingsScreen';
import SettingsUserProfileScreen from './screens/SettingsUserProfileScreen';
import SettingsDriverDefaultsScreen from './screens/SettingsDriverDefaultsScreen';
import SettingsNotificationsScreen from './screens/SettingsNotificationsScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'carpolly://', 'https://carpolly.com'],
  config: {
    screens: {
      HomeStack: {
        screens: {
          PollyDetail: 'polly/:id',
        },
      },
    },
  },
};

function MenuButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginRight: 10 }}>
      <Ionicons name="menu" size={24} color="black" />
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 20, alignItems: 'center', backgroundColor: 'rgba(248, 249, 250, 0.5)' }}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 100, height: 100, marginBottom: 10 }}
          resizeMode="contain"
        />
        <CustomText type='h1'>CarPolly</CustomText>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="FAQ"
        onPress={() => props.navigation.navigate('HomeStack', { screen: 'FAQ' })}
        icon={({ color, size }) => <Ionicons name="help-circle" color={color} size={size} />}
        labelStyle={{ fontFamily: 'Neucha_400Regular' }}
      />
      <DrawerItem
        label="About"
        onPress={() => props.navigation.navigate('HomeStack', { screen: 'About' })}
        icon={({ color, size }) => <Ionicons name="information-circle" color={color} size={size} />}
        labelStyle={{ fontFamily: 'Neucha_400Regular' }}
      />
      <DrawerItem
        label="Settings"
        onPress={() => props.navigation.navigate('HomeStack', { screen: 'Settings' })}
        icon={({ color, size }) => <Ionicons name="settings" color={color} size={size} />}
        labelStyle={{ fontFamily: 'Neucha_400Regular' }}
      />
      <DrawerItem
        label="Support"
        onPress={() => Linking.openURL('https://carpolly.com/support')}
        icon={({ color, size }) => <Ionicons name="headset" color={color} size={size} />}
        labelStyle={{ fontFamily: 'Neucha_400Regular' }}
      />
    </DrawerContentScrollView>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'CarPolly',
          headerStyle: {
            backgroundColor: 'rgba(248, 249, 250, 0.5)',
            height: 71,
          },
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontFamily: 'CabinSketch_400Regular',
            fontSize: 24,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <Image
              source={require('./assets/logo.png')}
              style={{ width: 70, height: 70, marginLeft: 10 }}
              resizeMode="contain"
            />
          ),
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen name="PollyDetail" component={PollyDetailScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="SettingsUserProfile"
        component={SettingsUserProfileScreen}
        options={{ title: 'User Profile' }}
      />
      <Stack.Screen
        name="SettingsDriverDefaults"
        component={SettingsDriverDefaultsScreen}
        options={{ title: 'Driver Defaults' }}
      />
      <Stack.Screen
        name="SettingsNotifications"
        component={SettingsNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Neucha_400Regular,
    CabinSketch_400Regular,
  });
  const networkState = useNetworkState();

  React.useEffect(() => {
    // Initialize background task service
    backgroundTaskService.init();
  }, []);


  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {networkState.isInternetReachable === false && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 30, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <CustomText style={{ color: 'white', fontSize: 14 }}>Offline</CustomText>
        </View>
      )}
      <NavigationContainer linking={linking as any}>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: 'rgba(248, 249, 250, 0.5)',
            },
            drawerLabelStyle: {
              fontFamily: 'Neucha_400Regular',
            },
          }}
        >
          <Drawer.Screen
            name="HomeStack"
            component={HomeStack}
            options={{
              title: 'Home',
              drawerIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
              headerShown: false,
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer.Navigator>
        <StatusBar />
      </NavigationContainer>
    </View>
  );
}
