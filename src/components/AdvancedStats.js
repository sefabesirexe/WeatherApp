import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Compass, Sun, Moon } from 'lucide-react-native';

export default function AdvancedStats({ current, daily }) {
  if (!current || !daily) return null;

  const getArrayValue = (arr, index = 0) => (arr && arr[index] !== undefined ? arr[index] : null);

  const sunriseRaw = getArrayValue(daily.sunrise);
  const sunsetRaw = getArrayValue(daily.sunset);

  const sunrise = sunriseRaw ? new Date(sunriseRaw).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const sunset = sunsetRaw ? new Date(sunsetRaw).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  let windDir = '--';
  if (current.wind_direction_10m !== undefined) {
    let deg = current.wind_direction_10m;
    const dirs = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
    const dirIndex = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    windDir = dirs[dirIndex] || '--';
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Wind Box */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Rüzgar Yönü</Text>
          <Text style={styles.boxValue}>{windDir}</Text>
          <Text style={styles.boxSub}>{current.wind_speed_10m || 0} km/s</Text>
          <Compass color="rgba(255,255,255,0.2)" size={64} style={styles.bgIcon} />
        </View>
        
        {/* Sun Box */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Güneş</Text>
          <View style={styles.sunRow}>
            <Sun color="#fcd34d" size={20} />
            <Text style={styles.sunText}>{sunrise} Gün doğumu</Text>
          </View>
          <View style={styles.sunRow}>
            <Moon color="#fb923c" size={20} />
            <Text style={styles.sunText}>{sunset} Gün batımı</Text>
          </View>
        </View>
      </View>

      {/* Grid Box */}
      <View style={styles.gridBox}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Nem</Text>
          <Text style={styles.gridValue}>%{current.relative_humidity_2m || 0}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Hissedilen</Text>
          <Text style={styles.gridValue}>{Math.round(current.apparent_temperature || 0)}°</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>UV Endeksi</Text>
          <Text style={styles.gridValue}>{getArrayValue(daily.uv_index_max) || 0}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Basınç</Text>
          <Text style={styles.gridValue}>{current.surface_pressure || 0} mbar</Text>
        </View>
        <View style={[styles.gridItem, { borderBottomWidth: 0 }]}>
          <Text style={styles.gridLabel}>Yağış İhtimali</Text>
          <Text style={styles.gridValue}>%{getArrayValue(daily.precipitation_probability_max) || 0}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8, marginBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  box: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 20, marginHorizontal: 4, overflow: 'hidden' },
  boxTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  boxValue: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  boxSub: { color: 'white', fontSize: 16, fontWeight: '500', marginTop: 4 },
  bgIcon: { position: 'absolute', right: -10, bottom: -10 },
  sunRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  sunText: { color: 'white', fontSize: 14, fontWeight: '500', marginLeft: 8 },
  gridBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 20, marginHorizontal: 4 },
  gridItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  gridLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  gridValue: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
