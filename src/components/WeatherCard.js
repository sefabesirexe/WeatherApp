import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Calendar } from 'lucide-react-native';
import { getWeatherInfo } from '../utils/api';

export default function WeatherCard({ daily }) {
  if (!daily) return null;

  const IconComponent = (name) => {
    switch (name) {
      case 'Sun': return <Sun color="#fcd34d" size={24} />;
      case 'CloudSun': return <CloudSun color="#fcd34d" size={24} />;
      case 'CloudRain': return <CloudRain color="#93c5fd" size={24} />;
      case 'CloudSnow': return <CloudSnow color="#e0e7ff" size={24} />;
      case 'CloudLightning': return <CloudLightning color="#c4b5fd" size={24} />;
      case 'CloudFog': return <CloudFog color="#d1d5db" size={24} />;
      case 'CloudDrizzle': return <CloudDrizzle color="#bfdbfe" size={24} />;
      default: return <Cloud color="#d1d5db" size={24} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Calendar color="rgba(255,255,255,0.7)" size={16} />
        <Text style={styles.title}>5 günlük tahmin</Text>
      </View>
      
      {daily.time.slice(0, 5).map((time, index) => {
        const info = getWeatherInfo(daily.weather_code[index]);
        const dateObj = new Date(time);
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const dayText = index === 0 ? 'Bugün' : dayNames[dateObj.getDay()];

        return (
          <View key={index} style={styles.row}>
            <View style={styles.iconContainer}>
              {IconComponent(info.icon)}
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.date}>{dayText} <Text style={styles.desc}>{info.desc}</Text></Text>
            </View>
            <Text style={styles.temp}>{Math.round(daily.temperature_2m_max[index])}° / <Text style={styles.tempMin}>{Math.round(daily.temperature_2m_min[index])}°</Text></Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 20, marginVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  iconContainer: { width: 40, alignItems: 'center' },
  dateContainer: { flex: 1, paddingLeft: 10 },
  date: { color: 'white', fontSize: 16, fontWeight: '600' },
  desc: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '400' },
  temp: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'right' },
  tempMin: { color: 'rgba(255,255,255,0.5)', fontWeight: '400' }
});
