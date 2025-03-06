import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Lottie from 'lottie-react-native';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [city, setCity] = useState('');
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_KEY = 'e48591a7cf6c33fb57a7cd4be81233ba';

  const fetchForecast = async () => {
    if (!city) {
      alert('Please enter a city name!');
      return;
    }
    setLoading(true);
    try {
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      setForecast(forecastResponse.data);

      const { lat, lon } = forecastResponse.data.city.coord;
      const airQualityResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      setAirQuality(airQualityResponse.data);
    } catch (error) {
      if (error.response) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error fetching data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const extractDailyForecast = () => {
    const days = {};
    forecast.list.forEach((item) => {
      const date = item.dt_txt.split(' ')[0];
      if (!days[date]) {
        days[date] = item;
      }
    });
    return Object.values(days);
  };

  const getAnimation = (condition) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('snow')) return require('./assets/animations/snowy.json');
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      return require('./assets/animations/rainy.json');
    }
    if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return require('./assets/animations/cloudy.json');
    }
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return require('./assets/animations/sunny.json');
    }
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return require('./assets/animations/thunderstorm.json');
    }
    return null;
  };

  const getAQILevel = (aqi) => {
    switch (aqi) {
      case 1:
        return 'Good';
      case 2:
        return 'Fair';
      case 3:
        return 'Moderate';
      case 4:
        return 'Poor';
      case 5:
        return 'Very Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <LinearGradient colors={['#4A5568', '#2C3E50']} style={styles.container}>
      <ScrollView>
        <View style={styles.searchContainer}>
          <Text style={styles.title}>Weather App</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter city name"
            placeholderTextColor="#ccc"
            value={city}
            onChangeText={setCity}
          />
          <Text style={styles.button} onPress={fetchForecast}>
            Search
          </Text>
          {loading && <ActivityIndicator size="large" color="#ffffff" />}
        </View>

        {forecast && (
          <>
            {/* Current Weather */}
            <View style={styles.currentWeatherContainer}>
              {getAnimation(forecast?.list[0]?.weather[0]?.description?.toLowerCase()) ? (
                <Lottie
                  source={getAnimation(forecast?.list[0]?.weather[0]?.description?.toLowerCase())}
                  autoPlay
                  loop
                  style={styles.animation}
                />
              ) : (
                <Text style={styles.noAnimationText}>
                  No animation available for this weather condition.
                </Text>
              )}
              <Text style={styles.cityName}>
                {forecast.city.name}, {forecast.city.country}
              </Text>
              <Text style={styles.currentTemp}>
                {forecast.list[0].main.temp.toFixed(1)}°C
              </Text>
              <Text style={styles.currentCondition}>
                {forecast.list[0].weather[0].description}
              </Text>
            </View>

            {/* Air Quality */}
            {airQuality && (
              <View style={styles.airQualityContainer}>
                <Text style={styles.sectionTitle}>Air Quality Index</Text>
                <Text style={styles.airQualityText}>
                  AQI: {airQuality.list[0].main.aqi} ({getAQILevel(airQuality.list[0].main.aqi)})
                </Text>
              </View>
            )}

            {/* Hourly Forecast */} 
            <View style={styles.hourlyContainer}>
              <Text style={styles.sectionTitle}>Hourly Forecast</Text>
              <FlatList
                data={forecast.list.slice(0, 8)}
                renderItem={({ item }) => (
                  <View style={styles.hourlyCard}>
                    <Text style={styles.hourlyTime}>{item.dt_txt.split(' ')[1]}</Text>
                    <Image
                      style={styles.hourlyIcon}
                      source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` }}
                    />
                    <Text style={styles.hourlyTemp}>{item.main.temp.toFixed(1)}°C</Text>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyList}
              />
            </View>

            {/* 7-Day Forecast */}
            <View style={styles.dailyContainer}>
              <Text style={styles.sectionTitle}>7-Day Forecast</Text>
              {extractDailyForecast().map((day, index) => (
                <View key={index} style={styles.dailyCard}>
                  <Text style={styles.dailyDate}>{day.dt_txt.split(' ')[0]}</Text>
                  <Image
                    style={styles.dailyIcon}
                    source={{ uri: `https://openweathermap.org/img/wn/${day.weather[0].icon}.png` }}
                  />
                  <Text style={styles.dailyTemp}>
                    {day.main.temp_min.toFixed(1)}°C - {day.main.temp_max.toFixed(1)}°C
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 50,
    width: '90%',
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    width: '90%',
    textAlign: 'center',
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#5a58ff',
    borderRadius: 25,
    marginBottom: 20,
  },
  currentWeatherContainer: {
    alignItems: 'center',
    padding: 20,
  },
  animation: {
    width: width * 0.7,
    height: height * 0.35,
    marginVertical: 10,
  },
  noAnimationText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  cityName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  currentTemp: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
  },
  currentCondition: {
    fontSize: 18,
    color: '#ccc',
  },
  airQualityContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  airQualityText: {
    fontSize: 18,
    color: '#fff',
  },
  hourlyContainer: {
    marginVertical: 10,
  },
  hourlyList: {
    paddingHorizontal: 10,
  },
  hourlyCard: {
    backgroundColor: '#444',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  hourlyTime: {
    fontSize: 14,
    color: '#fff',
  },
  hourlyIcon: {
    width: 40,
    height: 40,
    marginVertical: 5,
  },
  hourlyTemp: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  dailyContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  dailyCard: {
    backgroundColor: '#444',
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyDate: {
    fontSize: 16,
    color: '#fff',
  },
  dailyIcon: {
    width: 40,
    height: 40,
  },
  dailyTemp: {
    fontSize: 16,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    marginVertical: 10,
    textAlign: 'center',
  },
});