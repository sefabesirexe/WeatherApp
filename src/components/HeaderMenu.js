import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { APP_VERSION } from '../utils/versioning';

export default function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.button}>
        <MoreVertical color="white" size={28} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Sürüm: {APP_VERSION}</Text>
            </View>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setVisible(false);
                navigation.navigate('Log');
              }}
            >
              <Text style={styles.menuText}>Değişim Günlüğü (Log)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { padding: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menu: { backgroundColor: 'white', marginTop: 50, marginRight: 20, borderRadius: 12, padding: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuText: { fontSize: 16, color: '#333', fontWeight: '500' }
});
