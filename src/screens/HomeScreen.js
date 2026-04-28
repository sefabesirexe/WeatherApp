import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Linking, ActivityIndicator, KeyboardAvoidingView, Platform, Animated as RNAnimated, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useStore } from '../store/useStore';
import { fetchWeather, fetchAirQuality, searchCity, getWeatherInfo, generateAlerts } from '../utils/api';
import WeatherCard from '../components/WeatherCard';
import HourlyForecast from '../components/HourlyForecast';
import AdvancedStats from '../components/AdvancedStats';
import HeaderMenu from '../components/HeaderMenu';
import { Search, Plus, MapPin, Clock, Leaf, AlertTriangle, AlertOctagon, X, Trash2 } from 'lucide-react-native';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const PARALLAX_OFFSET = 40;

export default function HomeScreen() {
  const { cities, addCity, removeCity } = useStore();
  const [currentWeather, setCurrentWeather] = useState(null);
  const [currentAQI, setCurrentAQI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('Yükleniyor...');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const bgX = useRef(new RNAnimated.Value(0)).current;
  const bgY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener(accelerometerData => {
        RNAnimated.spring(bgX, {
          toValue: accelerometerData.x * PARALLAX_OFFSET * 1.5,
          useNativeDriver: true,
          bounciness: 0,
          speed: 2,
        }).start();
        RNAnimated.spring(bgY, {
          toValue: -accelerometerData.y * PARALLAX_OFFSET * 1.5,
          useNativeDriver: true,
          bounciness: 0,
          speed: 2,
        }).start();
      })
    );
    Accelerometer.setUpdateInterval(50);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const loadData = async (lat, lon, cityName = 'Mevcut Konum') => {
    try {
      const [weather, aqi] = await Promise.all([
        fetchWeather(lat, lon),
        fetchAirQuality(lat, lon)
      ]);
      setCurrentWeather({ ...weather, cityName });
      setCurrentAQI(aqi);
      setUpdateStatus('Başarıyla güncellendi');
    } catch (error) {
      console.error(error);
      setUpdateStatus('Güncellenemedi');
    }
  };

  const initLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        await loadData(location.coords.latitude, location.coords.longitude);
      } else if (cities.length > 0) {
        setSelectedCity(cities[0]);
        await loadData(cities[0].latitude, cities[0].longitude, cities[0].name);
      }
    } catch (error) {
      console.error(error);
      setUpdateStatus('Konum Bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initLocation();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setUpdateStatus('Güncelleniyor...');
    try {
      if (selectedCity) {
        await loadData(selectedCity.latitude, selectedCity.longitude, selectedCity.name);
      } else {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getLastKnownPositionAsync({});
          if (!location) location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await loadData(location.coords.latitude, location.coords.longitude);
        } else if (cities.length > 0) {
          await loadData(cities[0].latitude, cities[0].longitude, cities[0].name);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedCity, cities]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 1) {
        const results = await searchCity(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAddCity = (city) => {
    addCity({ id: city.id, name: city.name, latitude: city.latitude, longitude: city.longitude });
    setSearchResults([]);
    setSearchQuery('');
    setSearchModalVisible(false);
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    loadData(city.latitude, city.longitude, city.name);
  };

  const handleCurrentLocation = async () => {
    setSelectedCity(null);
    initLocation();
  };

  const getBackgroundImage = () => {
    if (!currentWeather) return require('../../assets/backgrounds/sunny.png');
    const isDay = currentWeather.current.is_day;
    const code = currentWeather.current.weather_code;
    
    if (code <= 1) { // Clear
      return isDay ? require('../../assets/backgrounds/sunny.png') : require('../../assets/backgrounds/night.png');
    } else if (code <= 3) { // Cloudy
      return isDay ? require('../../assets/backgrounds/rain.png') : require('../../assets/backgrounds/night.png');
    } else if (code >= 51 && code <= 77) { // Rain or Snow
      return require('../../assets/backgrounds/rain.png');
    } else { // Storm or Fog
      return isDay ? require('../../assets/backgrounds/rain.png') : require('../../assets/backgrounds/night.png');
    }
  };

  const renderCurrentWeather = () => {
    if (!currentWeather) return null;
    const info = getWeatherInfo(currentWeather.current.weather_code);
    const alert = generateAlerts(currentWeather);
    const todayMax = Math.round(currentWeather.daily.temperature_2m_max[0]);
    const todayMin = Math.round(currentWeather.daily.temperature_2m_min[0]);
    
    return (
      <View style={styles.currentWeatherContainer}>
        {/* Main Temp */}
        <Text style={styles.tempMain}>
          {Math.round(currentWeather.current.temperature_2m)}<Text style={styles.tempUnit}>°C</Text>
        </Text>
        
        {/* Desc and High/Low */}
        <Text style={styles.descMain}>
          {info.desc}  {todayMax}° / {todayMin}°
        </Text>
        
        {/* AQI Pill */}
        <TouchableOpacity 
          style={styles.aqiPill}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://waqi.info/')}
        >
          <Leaf color="rgba(255,255,255,0.9)" size={16} />
          <Text style={styles.aqiText}>HKE {currentAQI ? currentAQI.current.european_aqi : '--'}</Text>
        </TouchableOpacity>

        {/* Alert Banner */}
        {alert && (
          <View style={[styles.alertBanner, { backgroundColor: `${alert.color}33`, borderColor: `${alert.color}66` }]}>
            <AlertTriangle color={alert.color} size={18} />
            <Text style={[styles.alertText, { color: alert.color }]}>{alert.message}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Background Image */}
      <RNAnimated.Image
        source={getBackgroundImage()}
        style={[
          styles.backgroundImage,
          {
            transform: [
              { translateX: bgX },
              { translateY: bgY }
            ]
          }
        ]}
      />
      {/* Dark overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSearchModalVisible(true)} style={styles.headerIconBtn}>
              <Plus color="white" size={28} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerCityName}>{currentWeather ? currentWeather.cityName : 'Konum Aranıyor'}</Text>
              {!loading && (
                <View style={styles.updateStatusContainer}>
                  <Clock color="rgba(255,255,255,0.6)" size={12} />
                  <Text style={styles.updateStatusText}>{updateStatus}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerIconBtn}>
              <HeaderMenu />
            </View>
          </View>

          {/* Main Content */}
          <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
          >
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ marginTop: 80 }} />
            ) : (
              <>
                {renderCurrentWeather()}
                <HourlyForecast hourly={currentWeather?.hourly} />
                <WeatherCard daily={currentWeather?.daily} />
                <AdvancedStats current={currentWeather?.current} daily={currentWeather?.daily} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Search Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent={true} onRequestClose={() => setSearchModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Yönetimi</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)} style={styles.closeBtn}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSearchContainer}>
              <Search color="#9ca3af" size={20} />
              <TextInput 
                style={styles.modalSearchInput}
                placeholder="Şehir, ilçe ara..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {searchQuery.length > 0 ? (
                searchResults.map((item) => (
                  <View key={item.id} style={styles.searchResultItem}>
                    <Text style={styles.searchResultText}>{item.name}, {item.country || ''}</Text>
                    <TouchableOpacity onPress={() => handleAddCity(item)}>
                      <Plus color="#4ade80" size={28} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <>
                  <Text style={styles.savedCitiesTitle}>Kayıtlı Konumlar</Text>
                  <TouchableOpacity style={styles.savedCityItem} onPress={() => { handleCurrentLocation(); setSearchModalVisible(false); }}>
                    <View style={styles.savedCityLeft}>
                      <MapPin color="white" size={20} />
                      <Text style={[styles.savedCityText, { marginLeft: 12 }]}>Mevcut Konumum</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {cities.map(city => (
                    <TouchableOpacity key={city.id} style={styles.savedCityItem} onPress={() => { handleSelectCity(city); setSearchModalVisible(false); }}>
                      <View style={styles.savedCityLeft}>
                        <Text style={[styles.savedCityText, { marginLeft: 32 }]}>{city.name}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeCity(city.id)} style={{ padding: 8 }}>
                        <Trash2 color="#ef4444" size={20} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: 'black' },
  backgroundImage: {
    position: 'absolute',
    top: -PARALLAX_OFFSET,
    left: -PARALLAX_OFFSET,
    width: width + PARALLAX_OFFSET * 2,
    height: height + PARALLAX_OFFSET * 2,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Very light dark overlay for better text contrast
  },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 10 },
  headerIconBtn: { padding: 8, width: 50 },
  titleContainer: { flex: 1, alignItems: 'center' },
  headerCityName: { fontSize: 24, fontWeight: '600', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  updateStatusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  updateStatusText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginLeft: 4 },
  container: { flex: 1, paddingHorizontal: 20 },
  
  currentWeatherContainer: { alignItems: 'center', marginTop: 50 },
  tempMain: { fontSize: 110, color: 'white', fontFamily: Platform.OS === 'android' ? 'sans-serif-light' : 'System', fontWeight: '200', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  tempUnit: { fontSize: 40, fontWeight: '300' },
  descMain: { fontSize: 20, color: 'white', fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, marginBottom: 16 },
  
  aqiPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, marginBottom: 24 },
  aqiText: { color: 'white', fontWeight: '600', marginLeft: 8, fontSize: 14 },
  
  alertBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12, width: '100%', marginBottom: 16 },
  alertText: { fontSize: 14, fontWeight: '600', marginLeft: 10, flex: 1 },

  // Modal Styles
  modalBg: { flex: 1, backgroundColor: '#111827' }, // Dark slate background for modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  closeBtn: { padding: 4 },
  modalSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, margin: 20 },
  modalSearchInput: { flex: 1, color: 'white', paddingVertical: 14, paddingLeft: 12, fontSize: 16 },
  modalScroll: { flex: 1, paddingHorizontal: 20 },
  searchResultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  searchResultText: { color: 'white', fontSize: 16, flex: 1 },
  savedCitiesTitle: { color: '#9ca3af', fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 16 },
  savedCityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  savedCityLeft: { flexDirection: 'row', alignItems: 'center' },
  savedCityText: { color: 'white', fontSize: 16, fontWeight: '500' }
});
