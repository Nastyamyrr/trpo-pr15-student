<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCities } from './composables/useCities.js'
import { useWeather } from './composables/useWeather.js'
import CitySelector from './components/CitySelector.vue'
import CurrentWeather from './components/CurrentWeather.vue'
import ForecastList from './components/ForecastList.vue'

const {
  cities,
  loading: citiesLoading,
  error: citiesError,
  loadCities
} = useCities()

const {
  weather,
  loading,
  error,
  lastUpdated,
  offlineMode,
  hasData,
  fetchWeather,
  setOfflineMode,
  clear
} = useWeather()

const selectedCity = ref(null)
const apiFields = ref({ current: [], daily: [] })
const weatherCodes = ref({})

onMounted(async () => {
  await Promise.all([
    loadCities(),
    loadApiFields(),
    loadWeatherCodes()
  ])
})

async function loadApiFields() {
  try {
    const res = await fetch('/dataset/api_fields.json')
    if (!res.ok) throw new Error('api_fields.json')
    apiFields.value = await res.json()
  } catch {
    // fallback из задания
    apiFields.value = {
      current: ['temperature_2m', 'weather_code', 'wind_speed_10m'],
      daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min']
    }
  }
}

async function loadWeatherCodes() {
  try {
    const res = await fetch('/dataset/weather_codes.json')
    if (!res.ok) throw new Error('weather_codes.json')
    weatherCodes.value = await res.json()
  } catch {
    weatherCodes.value = {
      '0': 'Ясно',
      '1': 'Преимущественно ясно',
      '2': 'Переменная облачность',
      '3': 'Пасмурно',
      '61': 'Дождь'
    }
  }
}

async function loadWeather() {
  if (!selectedCity.value) {
    clear()
    return
  }
  await fetchWeather(selectedCity.value, apiFields.value, weatherCodes.value)
}

function onCityChange(city) {
  selectedCity.value = city
  loadWeather()
}

function toggleOffline() {
  setOfflineMode(!offlineMode.value)
  if (selectedCity.value) {
    loadWeather()
  }
}

function formatTime(date) {
  if (!date) return '—'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Автозагрузка при смене offline-режима уже в toggleOffline
</script>

<template>
  <header>
    <div class="brand">Практическая работа 15</div>
    <span>ТРПО · Weather API</span>
  </header>

  <div class="wrap">
    <div class="hero">
      <span class="pill">Vue 3 · Composition API · Open-Meteo</span>
      <h1>Погодный менеджер</h1>
      <p class="muted">
        Города из <code>dataset/cities.csv</code>, коды погоды из
        <code>weather_codes.json</code>, поля запроса из <code>api_fields.json</code>.
      </p>

      <div class="controls">
        <CitySelector
          :cities="cities"
          :model-value="selectedCity"
          :disabled="loading || citiesLoading"
          @update:model-value="onCityChange"
        />

        <button
          class="btn"
          :disabled="loading || !selectedCity"
          @click="loadWeather"
        >
          {{ loading ? 'Загрузка…' : 'Обновить' }}
        </button>

        <button
          class="btn secondary"
          :class="{ active: offlineMode }"
          :disabled="loading"
          @click="toggleOffline"
        >
          {{ offlineMode ? 'Offline (mock)' : 'Online (API)' }}
        </button>
      </div>

      <div class="meta" v-if="lastUpdated">
        Последнее обновление: {{ formatTime(lastUpdated) }}
        <span v-if="offlineMode"> · режим mock</span>
      </div>

      <div class="meta" v-if="citiesError" style="color: #991b1b">
        Ошибка загрузки городов: {{ citiesError }}
      </div>
    </div>

    <!-- Состояния интерфейса -->
    <div v-if="loading" class="state-box loading">
      Загрузка погоды…
    </div>

    <div v-else-if="error" class="state-box error">
      <strong>Ошибка:</strong> {{ error }}
      <div class="hint">
        Проверьте сеть или переключитесь в Offline (mock) режим.
      </div>
      <div style="margin-top: 14px">
        <button class="btn" :disabled="!selectedCity" @click="loadWeather">
          Повторить
        </button>
      </div>
    </div>

    <div v-else-if="!selectedCity" class="state-box empty">
      Выберите город, чтобы загрузить погоду.
    </div>

    <div v-else-if="hasData" class="weather-panel">
      <div class="weather-top">
        <CurrentWeather
          :city-name="selectedCity.name"
          :data="weather.current"
        />
        <ForecastList :days="weather.daily" />
      </div>
    </div>

    <div v-else class="state-box empty">
      Нет данных для отображения.
    </div>
  </div>
</template>
