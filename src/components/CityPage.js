import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Linking, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { fetchWeather, fetchAirQuality, getWeatherInfo, generateAlerts, reverseGeocode } from '../utils/api';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import HourlyForecast from './HourlyForecast';
import WeatherCard from './WeatherCard';
import AdvancedStats from './AdvancedStats';
import { Leaf, AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CityPage({ city, isCurrentLocation, onWeatherCodeUpdate }) {
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cityName, setCityName] = useState(city ? city.name : 'Konum Aranıyor...');

  const loadData = async (lat, lon, name) => {
    try {
      const [w, a] = await Promise.all([
        fetchWeather(lat, lon),
        fetchAirQuality(lat, lon)
      ]);
      setWeather(w);
      setAqi(a);
      setCityName(name);
      if (onWeatherCodeUpdate) {
        onWeatherCodeUpdate({ code: w.current.weather_code, isDay: w.current.is_day });
      }
    } catch (e) {
      console.error(e);
      setCityName('Bağlantı Hatası');
    }
  };

  const initLocation = async () => {
    setLoading(true);
    if (isCurrentLocation) {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getLastKnownPositionAsync({});
          if (!location) location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          
          const geoName = await reverseGeocode(location.coords.latitude, location.coords.longitude);
          await loadData(location.coords.latitude, location.coords.longitude, geoName);
        } else {
          setCityName('Konum İzni Yok');
        }
      } catch (e) {
        console.error(e);
      }
    } else if (city) {
      await loadData(city.latitude, city.longitude, city.name);
    }
    setLoading(false);
  };

  useEffect(() => {
    initLocation();
  }, [city]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initLocation();
    setRefreshing(false);
  }, [city, isCurrentLocation]);

  if (loading) {
    return (
      <View style={[styles.page, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Hava durumu yüklenemedi.</Text>
      </View>
    );
  }

  const info = getWeatherInfo(weather.current.weather_code);
  const alert = generateAlerts(weather);
  const todayMax = Math.round(weather.daily.temperature_2m_max[0]);
  const todayMin = Math.round(weather.daily.temperature_2m_min[0]);

  return (
    <ScrollView 
      style={styles.page}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.currentWeatherContainer}>
        <Text style={styles.cityName} numberOfLines={1} adjustsFontSizeToFit>{cityName}</Text>
        
        {/* Frutiger Aero Glossy Text */}
        <View style={styles.glossyTextWrapper}>
          <MaskedView
            style={{ height: 140, width: '100%' }}
            maskElement={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.tempMain}>
                  {Math.round(weather.current.temperature_2m)}<Text style={styles.tempUnit}>°</Text>
                </Text>
              </View>
            }
          >
            <LinearGradient
              colors={['#ffffff', '#e0f2fe', '#bae6fd', '#ffffff']}
              locations={[0, 0.4, 0.6, 1]}
              style={{ flex: 1 }}
            />
          </MaskedView>
        </View>
        
        <View style={styles.glossyDescWrapper}>
          <Text style={styles.descMain}>
            {info.desc}
          </Text>
          <Text style={styles.descHighLow}>
            Y: {todayMax}°  D: {todayMin}°
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.aqiPill}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://waqi.info/')}
        >
          <Leaf color="white" size={16} />
          <Text style={styles.aqiText}>HKE {aqi ? aqi.current.european_aqi : '--'}</Text>
        </TouchableOpacity>

        {alert && (
          <View style={[styles.alertBanner, { backgroundColor: `${alert.color}44`, borderColor: `${alert.color}88` }]}>
            <AlertTriangle color={alert.color} size={18} />
            <Text style={[styles.alertText, { color: alert.color }]}>{alert.message}</Text>
          </View>
        )}
      </View>

      <HourlyForecast hourly={weather.hourly} />
      <WeatherCard daily={weather.daily} />
      <AdvancedStats current={weather.current} daily={weather.daily} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: width, flex: 1 },
  errorText: { color: 'white', fontSize: 16 },
  currentWeatherContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  cityName: { fontSize: 32, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6, marginBottom: 5, paddingHorizontal: 10, textAlign: 'center' },
  glossyTextWrapper: { width: '100%', alignItems: 'center', shadowColor: '#ffffff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  tempMain: { 
    fontSize: 130, 
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Helvetica Neue', 
    fontWeight: 'bold', 
    letterSpacing: -4,
  },
  tempUnit: { fontSize: 50, fontWeight: 'bold' },
  glossyDescWrapper: { alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  descMain: { fontSize: 26, color: 'white', fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  descHighLow: { fontSize: 16, color: '#e0f2fe', fontWeight: '600', marginTop: 4 },
  aqiPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  aqiText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, width: '100%', marginBottom: 16 },
  alertText: { fontSize: 14, fontWeight: 'bold', marginLeft: 10, flex: 1 },
});
