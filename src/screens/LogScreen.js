import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { APP_LOGS, APP_VERSION } from '../utils/versioning';

export default function LogScreen() {
  const renderItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.versionBadge}>v{item.version}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mevcut Sürüm: {APP_VERSION}</Text>
      </View>
      <FlatList
        data={APP_LOGS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  list: { padding: 16 },
  logCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  versionBadge: { backgroundColor: '#3b82f6', color: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontWeight: 'bold', fontSize: 14 },
  date: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  message: { color: '#334155', fontSize: 16, lineHeight: 24 }
});
