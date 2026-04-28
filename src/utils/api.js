export const fetchWeather = async (lat, lon) => {
  const url = `${process.env.EXPO_PUBLIC_WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
  const response = await fetch(url);
  return await response.json();
};

export const fetchAirQuality = async (lat, lon) => {
  const url = `${process.env.EXPO_PUBLIC_AQI_API}?latitude=${lat}&longitude=${lon}&current=european_aqi`;
  const response = await fetch(url);
  return await response.json();
};

export const searchCity = async (query) => {
  const url = `${process.env.EXPO_PUBLIC_GEOCODING_API}?name=${encodeURIComponent(query)}&count=10&language=tr&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results) {
    return data.results.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [];
};

export const generateAlerts = (weatherData) => {
  if (!weatherData || !weatherData.current) return null;
  const temp = weatherData.current.temperature_2m;
  const wind = weatherData.current.wind_speed_10m;
  
  if (temp <= 3) {
    return { type: 'Sarı Uyarı', message: 'Don için Sarı Uyarı: Gizli buzlanma tehlikesi.', color: '#f59e0b', icon: 'AlertTriangle' };
  }
  if (temp >= 35) {
    return { type: 'Turuncu Uyarı', message: 'Aşırı Sıcaklık Uyarısı: Güneş çarpması tehlikesi.', color: '#f97316', icon: 'AlertTriangle' };
  }
  if (wind >= 50) {
    return { type: 'Kırmızı Uyarı', message: 'Fırtına için Kırmızı Uyarı: Şiddetli rüzgar tehlikesi.', color: '#ef4444', icon: 'AlertOctagon' };
  }
  return null;
};

// Weather codes to icons / descriptions
export const getWeatherInfo = (code) => {
  const map = {
    0: { desc: 'Açık', icon: 'Sun' },
    1: { desc: 'Çoğunlukla Açık', icon: 'Sun' },
    2: { desc: 'Parçalı Bulutlu', icon: 'CloudSun' },
    3: { desc: 'Bulutlu', icon: 'Cloud' },
    45: { desc: 'Sisli', icon: 'CloudFog' },
    48: { desc: 'Kırağılı Sis', icon: 'CloudFog' },
    51: { desc: 'Hafif Çiseleme', icon: 'CloudDrizzle' },
    53: { desc: 'Orta Çiseleme', icon: 'CloudDrizzle' },
    55: { desc: 'Şiddetli Çiseleme', icon: 'CloudDrizzle' },
    61: { desc: 'Hafif Yağmur', icon: 'CloudRain' },
    63: { desc: 'Orta Yağmur', icon: 'CloudRain' },
    65: { desc: 'Şiddetli Yağmur', icon: 'CloudRain' },
    71: { desc: 'Hafif Kar', icon: 'CloudSnow' },
    73: { desc: 'Orta Kar', icon: 'CloudSnow' },
    75: { desc: 'Şiddetli Kar', icon: 'CloudSnow' },
    95: { desc: 'Gök Gürültülü Fırtına', icon: 'CloudLightning' },
  };
  return map[code] || { desc: 'Bilinmiyor', icon: 'Cloud' };
};
