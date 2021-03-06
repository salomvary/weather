/* eslint-disable indent */
import {wire} from '/node_modules/hyperhtml/esm.js'
import WeatherNavbar from './weather-navbar.js'
import Icon from './icon.js'

/**
 * @typedef { import('./store.js').State } State
 */

/**
 * Weather view
 *
 * @param {State} state
 * @param {() => void} onRetry
 * @param {(location: string) => void} navigate
 * @param {(day: Date) => void} onDaySelect
 *
 * @returns {any}
 */
export default function WeatherView (
  state,
  onRetry,
  navigate,
  onDaySelect
) {
  return wire(state, ':weather-view')`
    <div class="view">
      ${WeatherNavbar(state.location, navigate)}
      <article class="page page-with-navbar">
        ${state.fetchError ? FetchError({onRetry}) : Weather(/** @type {darksky.Weather} */(state.weather), state.selectedDay, onDaySelect)}
      </article>
    </div>
  `
}

/**
 * @param {object} props
 * @param {() => void} props.onRetry
 *
 * @returns {any}
 */
function FetchError (props) {
  return wire(props)`
    <div class="fetch-error">
      <p>${Icon({icon: 'wi-thunderstorm', class: 'fetch-error-icon'})}</p>
      <p>Error fetching weather data.</p>
      <p><button class="btn" onclick=${props.onRetry}>Retry</button></p>
    </div>
  `
}

/**
 * @param {darksky.Weather} weather
 * @param {Date | null} selectedDay
 * @param {(day: Date) => void} onDaySelect
 * @returns {any}
 */
export function Weather (weather, selectedDay, onDaySelect) {
  const [today] = weather.daily.data
  return wire(weather)`
    <div class="weather">
      ${Currently(weather.currently, today || {})}
      ${Hourly(weather.hourly, selectedDay)}
      ${Daily(weather.daily, selectedDay, onDaySelect)}
    </div>
  `
}

/**
 * @param {darksky.HourlyData} currently
 * @param {darksky.DailyData} today
 *
 * @returns {any}
 */
function Currently (currently, today) {
  return wire(currently)`
    <section class="currently">
      <div class="currently-temperatures">
        <div class="currently-temperature">
          ${Temperature({value: currently.temperature})}
        </div>
        <div class="currently-highlow">
          High ${Temperature({value: today.temperatureHigh})}
          Low ${Temperature({value: today.temperatureLow})}
        </div>
      </div>
      <div class="currently-details">
        <div class="currently-icon">${Icon({icon: currently.icon})}</div>
        <div class="currently-summary">${currently.summary}</div>
      </div>
    </section>
  `
}

/**
 * @param {darksky.Forecast<darksky.HourlyData>} hourly
 * @param {Date | null} selectedDay
 *
 * @returns {any}
 */
function Hourly (hourly, selectedDay) {
  /** Use this margin when scrolling to a day */
  const margin = 8

  /** @type {HTMLElement[]} */
  const hours = hourly.data.map(Hour)

  /** @type {HTMLElement?} */
  let selectedNode = null

  if (selectedDay) {
    // Scroll to 7:00 AM of the selected day
    const startOfSelectedDay = new Date(selectedDay)
    startOfSelectedDay.setHours(7)

    const selectedIndex = hourly.data.findIndex(
      (hour) => hour.time >= startOfSelectedDay
    )

    selectedNode = selectedIndex > -1 ? hours[selectedIndex] : null
  }

  const section = wire(hourly)`
    <section class="forecast">
      ${hours}
    </section>
  `

  section.scrollLeft = selectedNode ? selectedNode.offsetLeft - section.offsetLeft - margin : 0

  return section
}

/**
 * @param {darksky.HourlyData} hour
 *
 * @returns {any}
 */
function Hour (hour) {
  return wire(hour)`
    <div class="forecast-item">
      <div class="forecast-item-time">${formatHour(hour.time)}</div>
      <div class="forecast-item-temperature">
        ${Temperature({value: hour.temperature})}
      </div>
      <div class="forecast-item-icon">${Icon({icon: hour.icon})}</div>
    </div>
  `
}

/**
 * @param {darksky.Forecast<darksky.DailyData>} daily
 * @param {Date | null} selectedDay
 * @param {(day: Date) => void} onSelect
 * @returns {any}
 */
function Daily (daily, selectedDay, onSelect) {
  return wire({daily, selectedDay})`
    <section class="forecast">
      ${
        daily.data.map((data) => Day(
          data,
          selectedDay != null && (+data.time === +selectedDay),
          onSelect
        ))
      }
    </section>
  `
}

/**
 * @param {object} props
 * @param {number} props.value
 *
 * @returns {any}
 */
function Temperature (props) {
  return wire(props)`
    <span class="temperature">${Math.round(props.value)}</span>
  `
}

const formatHour = memoize(
  /**
   * @param {Date} time
   *
   * @returns {string}
   */
  function formatHour (time) {
    return time.toLocaleTimeString('en-US-u-hc-h24', {hour: '2-digit', minute: '2-digit'})
  }
)

const formatDay = memoize(
  /**
   * @param {Date} day
   *
   * @returns {string}
   */
  function formatDay (day) {
    const now = new Date()
    if (isNextDay(now, day, 0)) {
      return 'Today'
    } else if (isNextDay(now, day, 1)) {
      return 'Tomorrow'
    } else {
      return day.toLocaleDateString('en-US', {weekday: 'long'})
    }
  }
)

const formatDate = memoize(
  /**
   * @param {Date} day
   *
   * @returns {string}
   */
  function formatDate (day) {
    return day.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'})
  }
)

// Fix toLocaleDateString performance issues on Chrome by memoization
/**
 * @template {object} In
 * @template Out
 * @param {(arg: In) => Out} fn
 */
function memoize (fn) {
  const cache = new WeakMap()
  /**
   * @param {In} arg
   * @returns {Out}
   */
  function memoized (arg) {
    let ret = cache.get(/** @type {object} */ (arg))
    if (!ret) {
      ret = fn(arg)
      cache.set(/** @type {object} */ (arg), ret)
    }
    return ret
  }

  return memoized
}

/**
 * @param {Date} now
 * @param {Date} date
 * @param {number} offset
 *
 * @returns {boolean}
 */
function isNextDay (now, date, offset) {
  const dateWithOffset = new Date(now)
  dateWithOffset.setDate(now.getDate() + offset)
  return (date.getDate() === dateWithOffset.getDate() &&
        date.getMonth() === dateWithOffset.getMonth() &&
        date.getFullYear() === dateWithOffset.getFullYear())
}

/**
 * @param {darksky.DailyData} day
 * @param {boolean} isSelected
 * @param {(day: Date) => void} onSelect
 *
 * @returns {any}
 */
function Day (day, isSelected, onSelect) {
  return wire(day)`
    <div
      class=${['forecast-item', 'day', isSelected ? 'selected' : ''].join(' ')}
      onclick=${(/** @type {PointerEvent} */ event) => {
        event.preventDefault()
        onSelect(day.time)
      }}
    >
      <div class="forecast-item-time">${formatDay(day.time)}</div>
      <div class="forecast-item-time">${formatDate(day.time)}</div>
      <div class="forecast-item-highlow">
        <div class="forecast-item-temperature">
          ${Temperature({value: day.temperatureHigh})}
        </div>
        <div class="forecast-item-temperature">
          ${Temperature({value: day.temperatureLow})}
        </div>
      </div>
      <div class="forecast-item-icon">${Icon({icon: day.icon})}</div>
    </div>
  `
}
