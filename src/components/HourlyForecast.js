import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Clock } from 'lucide-react-native';
import { getWeatherInfo } from '../utils/api';
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle } from 'lucide-react-native';

export default function HourlyForecast({ hourly }) {
  if (!hourly || !hourly.time) return null;

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
        <Clock color="rgba(255,255,255,0.7)" size={16} />
        <Text style={styles.title}>24-saatlik tahmin</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {hourly.time.slice(0, 24).map((time, index) => {
          const info = getWeatherInfo(hourly.weather_code[index]);
          const dateObj = new Date(time);
          const hourText = index === 0 ? 'Şimdi' : `${dateObj.getHours().toString().padStart(2, '0')}:00`;

          return (
            <View key={index} style={styles.item}>
              <Text style={styles.temp}>{Math.round(hourly.temperature_2m[index])}°</Text>
              <View style={styles.iconContainer}>{IconComponent(info.icon)}</View>
              <Text style={styles.wind}>{hourly.wind_speed_10m[index]}km/s</Text>
              <Text style={styles.time}>{hourText}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 20, marginVertical: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginLeft: 8 },
  scroll: { flexDirection: 'row' },
  item: { alignItems: 'center', marginRight: 24, width: 60 },
  temp: { color: 'white', fontSize: 18, fontWeight: '500', marginBottom: 8 },
  iconContainer: { marginVertical: 8 },
  wind: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 12 }
});
