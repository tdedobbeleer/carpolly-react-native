import React from 'react';
import { NavigationContainer, DrawerActions, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Image, Linking, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Neucha_400Regular } from '@expo-google-fonts/neucha';
import 'react-native-gesture-handler';
import HomeScreen from './screens/HomeScreen';
import PollyDetailScreen from './screens/PollyDetailScreen';
import Text from './components/CustomText';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

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
          style={{ width: 80, height: 80, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>CarPolly</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="FAQ"
        onPress={() => Linking.openURL('https://carpolly.com/faq')}
        icon={({ color, size }) => <Ionicons name="help-circle" color={color} size={size} />}
        labelStyle={{ fontFamily: 'Neucha_400Regular' }}
      />
      <DrawerItem
        label="About"
        onPress={() => Linking.openURL('https://carpolly.com/about')}
        icon={({ color, size }) => <Ionicons name="information-circle" color={color} size={size} />}
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
          },
          headerTitleAlign: 'center',
          headerTitleStyle: {
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <Image
              source={require('./assets/logo.png')}
              style={{ width: 50, height: 50, marginLeft: 10 }}
              resizeMode="contain"
            />
          ),
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen name="PollyDetail" component={PollyDetailScreen} options={{ title: 'Polly Details' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Neucha_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
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
          }}
        />
      </Drawer.Navigator>
      <StatusBar />
    </NavigationContainer>
  );
}
