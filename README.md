# Практическая работа №15  
## Vue погодный менеджер. Интеграция Weather API и состояния интерфейса

**Дисциплина:** Технологии разработки программного обеспечения  
**Институт:** Институт перспективных технологий и индустриального программирования  
**Кафедра:** Кафедра индустриального программирования  
**Преподаватель:** Макиевский Станислав Евгеньевич  
**Семестр:** 3 семестр, 2026-2027 гг.

---

## Краткое описание результата

Vue 3 приложение (Composition API + `<script setup>`) — погодный менеджер:

- выбор города из `dataset/cities.csv`;
- запрос к **Open-Meteo Forecast API** по координатам;
- отображение текущей погоды и 3-дневного прогноза;
- преобразование `weather_code` через `weather_codes.json`;
- состояния **loading / error / empty / success**;
- **offline-demo** режим на `mock_forecast.json`.

---

## Используемые технологии

- Vue 3.5+ (Composition API, script setup)
- Vite 6
- Fetch API + `URL` / `URLSearchParams`
- Open-Meteo Weather Forecast API (без ключа)

---

## Требования к окружению

- Node.js 18+ (рекомендуется 20+)
- npm 9+
- Доступ в интернет (для online-режима)

---

## Инструкция запуска

```bash
# 1. Клонировать / распаковать
cd trpo-pr15-weather-manager

# 2. Установить зависимости
npm install

# 3. Dev-сервер
npm run dev
```

Приложение: http://localhost:5173

### Production build

```bash
npm run build
npm run preview
```

---

## Структура проекта

```
trpo-pr15-weather-manager/
├── public/
│   └── dataset/
│       ├── cities.csv           # список городов (name, lat, lon, timezone)
│       ├── api_fields.json      # какие поля запрашивать у API
│       ├── weather_codes.json   # расшифровка weather_code
│       └── mock_forecast.json   # offline-заглушка
├── src/
│   ├── components/
│   │   ├── CitySelector.vue     # выбор города (v-model)
│   │   ├── CurrentWeather.vue   # текущая температура и условия
│   │   └── ForecastList.vue     # карточки прогноза
│   ├── composables/
│   │   ├── useCities.js         # загрузка и парсинг cities.csv
│   │   └── useWeather.js        # fetch, normalize, offline mode
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

---

## Dataset и как он используется

| Файл | Назначение |
|------|------------|
| `cities.csv` | Список городов; координаты берутся отсюда, а не хардкодятся |
| `api_fields.json` | Параметры `current` и `daily` для URL Open-Meteo |
| `weather_codes.json` | `weather_code` → человекочитаемая подпись |
| `mock_forecast.json` | Offline-режим для защиты / отсутствия сети |

---

## Пример URL запроса (без секретов)

```
https://api.open-meteo.com/v1/forecast
  ?latitude=55.7558
  &longitude=37.6176
  &current=temperature_2m,weather_code,wind_speed_10m
  &daily=weather_code,temperature_2m_max,temperature_2m_min
  &timezone=auto
  &forecast_days=3
```

**Схема ответа, которую использует приложение:**

```json
{
  "current": {
    "temperature_2m": 12.4,
    "weather_code": 3,
    "wind_speed_10m": 4.8
  },
  "daily": {
    "time": ["2026-09-16", "..."],
    "temperature_2m_max": [15, 16, 14],
    "temperature_2m_min": [7, 8, 6],
    "weather_code": [3, 61, 2]
  }
}
```

---

## Состояния интерфейса

| Состояние | Когда показывается |
|-----------|--------------------|
| **empty** | Город не выбран |
| **loading** | Идёт fetch |
| **error** | Сеть недоступна / HTTP ≠ OK / нет нужных полей в JSON |
| **success** | Есть нормализованные current + daily |

Обработанные ошибочные сценарии:

1. Город не выбран  
2. Сетевая / HTTP-ошибка  
3. Ответ без ожидаемых полей `current` / `daily`

---

## Offline (mock) режим

Кнопка **Online (API) / Offline (mock)** переключает источник данных.

В offline-режиме запрос идёт на `/dataset/mock_forecast.json` — удобно для защиты, если внешний API временно недоступен.

---

## Ключевой маршрут данных

```
cities.csv → CitySelector → selectedCity (lat/lon)
     ↓
api_fields.json + координаты → URL (URLSearchParams)
     ↓
fetch (Open-Meteo или mock)
     ↓
response.ok? → normalize + weather_codes.json
     ↓
CurrentWeather + ForecastList
```

---

## Composables

- **`useCities`** — загрузка и парсинг CSV, список городов.
- **`useWeather`** — `weather`, `loading`, `error`, `lastUpdated`, `fetchWeather`, offline-режим.  
  Не зависит от HTML-разметки, возвращает только состояние и операции.

---

## Что показать при защите

1. Чистый запуск по README (`npm install` → `npm run dev`)
2. Выбор города → реальный запрос в Network (или mock)
3. Использование `cities.csv` и `weather_codes.json`
4. Одно ошибочное состояние (например, offline без mock или сброс города)
5. Время последнего успешного обновления

---

## Контрольные ответы (кратко)

1. **Входные данные** — `public/dataset/` (cities, api_fields, weather_codes, mock).  
2. **Преобразование** — `useWeather.normalize` + маппинг кодов.  
3. **Ошибочное состояние** — HTTP-ошибка / отсутствие города / битый JSON.  
4. **При росте** — вынести API-слой, кэш, Pinia, больше дней прогноза.  
5. **После клонирования** — `npm install && npm run dev`.  
6. **Options vs Composition** — Options группирует по типу опции, Composition — по функциональной задаче.  
7. **Реактивность** — изменение `.value` у ref/computed запускает повторный рендер зависимых частей шаблона.
