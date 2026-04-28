import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated as RNAnimated, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { searchCity } from '../utils/api';
import CityPage from '../components/CityPage';
import HeaderMenu from '../components/HeaderMenu';
import { Search, Plus, MapPin, X, Trash2 } from 'lucide-react-native';
import { Accelerometer } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const PARALLAX_OFFSET = 40;

export default function HomeScreen() {
  const { cities, addCity, removeCity } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [pageWeathers, setPageWeathers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollRef = useRef(null);
  
  // Parallax
  const [accelData, setAccelData] = useState({ x: 0, y: 0 });
  const animatedX = useRef(new RNAnimated.Value(0)).current;
  const animatedY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    let subscription;
    Accelerometer.isAvailableAsync().then(available => {
      if (available) {
        Accelerometer.setUpdateInterval(30);
        subscription = Accelerometer.addListener(data => {
          setAccelData({ x: data.x, y: data.y });
        });
      }
    });
    return () => subscription && subscription.remove();
  }, []);

  useEffect(() => {
    RNAnimated.spring(animatedX, { toValue: accelData.x * PARALLAX_OFFSET, friction: 7, tension: 40, useNativeDriver: true }).start();
    RNAnimated.spring(animatedY, { toValue: accelData.y * PARALLAX_OFFSET, friction: 7, tension: 40, useNativeDriver: true }).start();
  }, [accelData]);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        const results = await searchCity(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleWeatherCodeUpdate = (index, data) => {
    setPageWeathers(prev => ({ ...prev, [index]: data }));
  };

  const onMomentumScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i !== activeIndex) setActiveIndex(i);
  };

  const getBackgroundImage = () => {
    const data = pageWeathers[activeIndex];
    if (!data) return require('../../assets/backgrounds/sunny.png');
    
    if (data.code >= 51 && data.code <= 82) return require('../../assets/backgrounds/rain.png');
    if (data.isDay === 0) return require('../../assets/backgrounds/night.png');
    return require('../../assets/backgrounds/sunny.png');
  };

  const navigateToPage = (index) => {
    setModalVisible(false);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ x: index * width, animated: true });
      }
    }, 300);
  };

  const handleAddCity = (city) => {
    addCity(city);
    setSearchQuery('');
    setSearchResults([]);
    navigateToPage(cities.length + 1);
  };

  const handleRemoveCity = (id) => {
    removeCity(id);
  };

  return (
    <View style={styles.wrapper}>
      <RNAnimated.Image 
        source={getBackgroundImage()} 
        style={[styles.bgImage, { transform: [{ translateX: animatedX }, { translateY: animatedY }] }]} 
        resizeMode="cover" 
      />
      <View style={styles.overlay} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconButton}>
            <Plus color="white" size={28} />
          </TouchableOpacity>
          
          <View style={styles.paginationDots}>
            <View style={[styles.dot, activeIndex === 0 && styles.activeDot]} />
            {cities.map((_, i) => (
              <View key={i} style={[styles.dot, activeIndex === i + 1 && styles.activeDot]} />
            ))}
          </View>
          
          <HeaderMenu />
        </View>

        <ScrollView 
          ref={scrollRef}
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          <CityPage 
            isCurrentLocation={true} 
            onWeatherCodeUpdate={(d) => handleWeatherCodeUpdate(0, d)} 
          />
          {cities.map((city, index) => (
            <CityPage 
              key={city.id} 
              city={city} 
              onWeatherCodeUpdate={(d) => handleWeatherCodeUpdate(index + 1, d)} 
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Modal - Şehir Ekleme ve Listeleme */}
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <X color="white" size={28} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Şehir Yönetimi</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.searchBar}>
              <Search color="gray" size={20} />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Şehir, ilçe, mahalle ara..." 
                placeholderTextColor="gray"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              {isSearching ? (
                <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />
              ) : searchQuery.length > 1 ? (
                <ScrollView style={styles.resultList}>
                  {searchResults.map(item => (
                    <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => handleAddCity(item)}>
                      <MapPin color="white" size={20} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.resultName}>{item.name}</Text>
                        <Text style={styles.resultCountry}>{item.country}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
                  <Text style={styles.emptyText}>Yukarıdan şehir, ilçe veya mahalle arayın.</Text>
                </View>
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: 'black' },
  bgImage: { position: 'absolute', top: -PARALLAX_OFFSET, left: -PARALLAX_OFFSET, width: width + PARALLAX_OFFSET * 2, height: height + PARALLAX_OFFSET * 2 },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.35)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  iconButton: { padding: 8 },
  paginationDots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  activeDot: { backgroundColor: 'white', width: 10, height: 10 },
  modalContainer: { flex: 1, backgroundColor: '#121212' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  modalCloseButton: { padding: 4 },
  searchBar: { flexDirection: 'row', backgroundColor: '#1e1e1e', marginHorizontal: 20, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 16 },
  searchInput: { color: 'white', marginLeft: 12, flex: 1, fontSize: 16 },
  resultList: { paddingHorizontal: 20 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  resultName: { color: 'white', fontSize: 18, fontWeight: '500' },
  resultCountry: { color: 'gray', fontSize: 14, marginTop: 4 },
  savedCitiesList: { paddingHorizontal: 20 },
  sectionTitle: { color: 'gray', fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  savedCityCardWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  savedCityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 16, borderRadius: 12 },
  savedCityName: { color: 'white', fontSize: 18, marginLeft: 12, fontWeight: '500' },
  deleteButton: { padding: 16, marginLeft: 8, backgroundColor: '#1e1e1e', borderRadius: 12 },
  emptyText: { color: 'gray', fontSize: 16, fontStyle: 'italic', marginTop: 10 }
});
