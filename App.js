import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Alert } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import LogScreen from './src/screens/LogScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // 1. Check Network
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        Alert.alert('Bağlantı Hatası', 'İnternet bağlantısı yok! Lütfen internetinizi kontrol edin.');
      }

      // 2. Check Location Permission
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Konum Uyarısı', 'Konum izni verilmedi veya kapalı. Otomatik konum bulma çalışmayacaktır. Lütfen ayarlardan açın.');
        }
      }

      setIsReady(true);
    };

    initApp();
  }, []);

  if (!isReady) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Log" 
          component={LogScreen} 
          options={{ title: 'Değişim Günlüğü' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
