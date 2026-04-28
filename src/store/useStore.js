import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create(
  persist(
    (set, get) => ({
      cities: [], // { name, latitude, longitude, id }
      addCity: (city) => {
        const { cities } = get();
        if (!cities.find(c => c.id === city.id)) {
          set({ cities: [...cities, city] });
        }
      },
      removeCity: (id) => set({
        cities: get().cities.filter(c => c.id !== id)
      })
    }),
    {
      name: 'weather-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
