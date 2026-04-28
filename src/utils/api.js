export const fetchWeather = async (lat, lon) => {
  const url = `${process.env.EXPO_PUBLIC_WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
  const response = await fetch(url);
  return await response.json();
};

export const fetchAirQuality = async (lat, lon) => {
  const url = `${process.env.EXPO_PUBLIC_AQI_API}?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`;
  const response = await fetch(url);
  return await response.json();
};

export const searchCity = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=10`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WeatherApp-ReactNative',
      'Accept-Language': 'tr'
    }
  });
  const data = await response.json();
  if (data && data.length > 0) {
    return data.map(item => ({
      id: item.place_id.toString(),
      name: item.name || item.display_name.split(',')[0],
      country: item.address?.country || '',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    }));
  }
  return [];
};

export const reverseGeocode = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherApp-ReactNative',
        'Accept-Language': 'tr'
      }
    });
    const data = await response.json();
    if (data && data.address) {
      // Return the most specific neighborhood/suburb/town name possible
      return data.address.neighbourhood || data.address.suburb || data.address.village || data.address.town || data.address.city_district || data.address.city || 'Mevcut Konum';
    }
  } catch (error) {
    console.error('Reverse geocode error:', error);
  }
  return 'Mevcut Konum';
};

export const generateAlerts = (weatherData) => {
  if (!weatherData || !weatherData.current) return null;
  const temp = weatherData.current.temperature_2m;
  const wind = weatherData.current.wind_speed_10m;
  
  if (temp <= 3) {
    return { type: 'Yellow Warning', message: 'Frost Warning: Risk of hidden ice.', color: '#f59e0b', icon: 'AlertTriangle' };
  }
  if (temp >= 35) {
    return { type: 'Orange Warning', message: 'Extreme Heat Warning: Risk of sunstroke.', color: '#f97316', icon: 'AlertTriangle' };
  }
  if (wind >= 50) {
    return { type: 'Red Warning', message: 'Storm Warning: Risk of severe winds.', color: '#ef4444', icon: 'AlertOctagon' };
  }
  return null;
};

export const getWeatherInfo = (code) => {
  if (code <= 1) return { desc: 'Açık', icon: 'Sun' };
  if (code <= 3) return { desc: 'Parçalı Bulutlu', icon: 'CloudSun' };
  if (code >= 51 && code <= 67) return { desc: 'Yağmurlu', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { desc: 'Karlı', icon: 'CloudSnow' };
  if (code >= 80 && code <= 82) return { desc: 'Sağanak', icon: 'CloudRain' };
  if (code >= 95) return { desc: 'Fırtınalı', icon: 'CloudLightning' };
  if (code === 45 || code === 48) return { desc: 'Sisli', icon: 'CloudFog' };
  return { desc: 'Bulutlu', icon: 'Cloud' };
};
