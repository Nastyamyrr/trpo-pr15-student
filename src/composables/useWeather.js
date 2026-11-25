import { ref, computed } from 'vue'

/**
 * Composable для загрузки погоды через Open-Meteo.
 * Хранит data / loading / error и умеет работать в offline-mock режиме.
 */
export function useWeather() {
  const weather = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)
  const offlineMode = ref(false)

  const hasData = computed(() => weather.value !== null && !error.value)

  /**
   * Формирует URL Open-Meteo по координатам и списку полей из api_fields.
   */
  function buildUrl(latitude, longitude, fields) {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(latitude))
    url.searchParams.set('longitude', String(longitude))
    url.searchParams.set('current', fields.current.join(','))
    url.searchParams.set('daily', fields.daily.join(','))
    url.searchParams.set('timezone', 'auto')
    url.searchParams.set('forecast_days', '3')
    return url
  }

  /**
   * Нормализует ответ API / mock в удобную структуру.
   */
  function normalize(data, codesMap) {
    if (!data?.current || !data?.daily) {
      throw new Error('В ответе отсутствуют ожидаемые поля current / daily')
    }

    const currentCode = data.current.weather_code
    const currentLabel = codesMap[String(currentCode)] ?? `Код ${currentCode}`

    const days = (data.daily.time || []).map((date, i) => {
      const code = data.daily.weather_code?.[i]
      return {
        date,
        max: data.daily.temperature_2m_max?.[i],
        min: data.daily.temperature_2m_min?.[i],
        weather_code: code,
        label: codesMap[String(code)] ?? `Код ${code}`
      }
    })

    return {
      current: {
        temperature: data.current.temperature_2m,
        weather_code: currentCode,
        wind_speed: data.current.wind_speed_10m,
        label: currentLabel
      },
      daily: days
    }
  }

  /**
   * Основная загрузка: реальный API или mock.
   * @param {{ latitude: number, longitude: number, name?: string }} city
   * @param {{ current: string[], daily: string[] }} fields
   * @param {Record<string, string>} codesMap
   */
  async function fetchWeather(city, fields, codesMap) {
    if (!city?.latitude || !city?.longitude) {
      error.value = 'Город не выбран'
      weather.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      let raw

      if (offlineMode.value) {
        const res = await fetch('/dataset/mock_forecast.json')
        if (!res.ok) throw new Error(`Mock HTTP ${res.status}`)
        raw = await res.json()
      } else {
        const url = buildUrl(city.latitude, city.longitude, fields)
        const res = await fetch(url.toString())
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: не удалось получить данные погоды`)
        }
        raw = await res.json()
      }

      weather.value = normalize(raw, codesMap)
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = e.message || 'Неизвестная ошибка загрузки'
      weather.value = null
    } finally {
      loading.value = false
    }
  }

  function setOfflineMode(value) {
    offlineMode.value = Boolean(value)
  }

  function clear() {
    weather.value = null
    error.value = null
    lastUpdated.value = null
  }

  return {
    weather,
    loading,
    error,
    lastUpdated,
    offlineMode,
    hasData,
    fetchWeather,
    setOfflineMode,
    clear,
    buildUrl
  }
}
