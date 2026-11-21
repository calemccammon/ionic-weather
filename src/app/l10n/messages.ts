/**
 * Every string the user sees or hears.
 *
 * Each is marked with Angular's `$localize`, so `ng extract-i18n` finds them
 * all here, and a second language is a translation file with these ids. A
 * string with gaps is a function of what fills them.
 */
export const messages = {
  appTitle: $localize`:@@appTitle:Weather`,
  tryAgain: $localize`:@@tryAgain:Try again`,
  today: $localize`:@@today:Today`,

  search: {
    hint: $localize`:@@search.hint:Search for a place`,
    /** Shown under the open search bar before anything is typed. */
    prompt: $localize`:@@search.prompt:Type a city, town or postcode`,
    nothingFound: (query: string) => $localize`:@@search.nothingFound:Nothing found for "${query}:query:"`,
    /** Screen-reader name of the progress bar shown while a search is on its way. */
    searching: $localize`:@@search.searching:Searching`,
    /** Name of the button that deselects the current place. */
    clear: $localize`:@@search.clear:Clear place`,
  },

  forecast: {
    /** Shown in the forecast area while no place is selected. */
    hint: $localize`:@@forecast.hint:Search for a place, or press and hold on the map, to see its forecast.`,
    /** Screen-reader name of the progress bar shown while a forecast is on its way. */
    loading: $localize`:@@forecast.loading:Loading the forecast`,
    thisWeek: $localize`:@@forecast.thisWeek:This week`,
    noDays: $localize`:@@forecast.noDays:No forecast for the coming days.`,
    /** Credit the weather service asks for. */
    credit: $localize`:@@forecast.credit:Weather data by Open-Meteo.com`,
  },

  units: {
    /** Screen-reader name of the units choice. */
    label: $localize`:@@units.label:Units`,
    celsius: $localize`:@@units.celsius:°C`,
    fahrenheit: $localize`:@@units.fahrenheit:°F`,
    celsiusName: $localize`:@@units.celsiusName:Celsius and km/h`,
    fahrenheitName: $localize`:@@units.fahrenheitName:Fahrenheit and mph`,
  },

  map: {
    label: $localize`:@@map.label:Map. Press and hold to pick a point.`,
    /** Credit the map's makers ask for. */
    credit: $localize`:@@map.credit:© OpenStreetMap contributors, OpenMapTiles, OpenFreeMap`,
    /** Screen-reader name of the pin on the map. */
    selectedPlace: $localize`:@@map.selectedPlace:Selected place`,
  },

  place: {
    /** What a place with no name is called, as a point picked off the map: "35.60°N, 82.55°W". */
    coordinates: (latitude: string, longitude: string) =>
      $localize`:@@place.coordinates:${latitude}:latitude:, ${longitude}:longitude:`,
    north: (degrees: string) => $localize`:@@place.north:${degrees}:degrees:°N`,
    south: (degrees: string) => $localize`:@@place.south:${degrees}:degrees:°S`,
    east: (degrees: string) => $localize`:@@place.east:${degrees}:degrees:°E`,
    west: (degrees: string) => $localize`:@@place.west:${degrees}:degrees:°W`,
  },

  temperature: {
    /** A temperature without its scale, as in a forecast row. */
    plain: (degrees: number) => $localize`:@@temperature.plain:${degrees}:degrees:°`,
    celsius: (degrees: number) => $localize`:@@temperature.celsius:${degrees}:degrees:°C`,
    fahrenheit: (degrees: number) => $localize`:@@temperature.fahrenheit:${degrees}:degrees:°F`,
    feelsLike: (degrees: number) => $localize`:@@temperature.feelsLike:Feels like ${degrees}:degrees:°`,
    /** As a screen reader should say it. */
    spokenCelsius: (degrees: number) => $localize`:@@temperature.spokenCelsius:${degrees}:degrees: degrees Celsius`,
    spokenFahrenheit: (degrees: number) =>
      $localize`:@@temperature.spokenFahrenheit:${degrees}:degrees: degrees Fahrenheit`,
  },

  /** The wind speed line. `speed` is one of the two below. */
  wind: (speed: string) => $localize`:@@wind:Wind ${speed}:speed:`,
  speed: {
    kmh: (speed: number) => $localize`:@@speed.kmh:${speed}:speed: km/h`,
    mph: (speed: number) => $localize`:@@speed.mph:${speed}:speed: mph`,
  },
  /** Chance of rain or snow in a forecast row. */
  precipitationChance: (percent: number) => $localize`:@@precipitationChance:${percent}:percent:%`,

  /** Whole blocks as one sentence for a screen reader. */
  spoken: {
    current: (condition: string, temperature: string, feelsLike: number, wind: string) =>
      $localize`:@@spoken.current:Now: ${condition}:condition:, ${temperature}:temperature:, feels like ${feelsLike}:feelsLike:, wind ${wind}:wind:`,
    day: (day: string, condition: string, low: number, high: number) =>
      $localize`:@@spoken.day:${day}:day:: ${condition}:condition:, low ${low}:low:, high ${high}:high: degrees`,
    dayWithChance: (day: string, condition: string, low: number, high: number, percent: number) =>
      $localize`:@@spoken.dayWithChance:${day}:day:: ${condition}:condition:, low ${low}:low:, high ${high}:high: degrees, ${percent}:percent: percent chance of precipitation`,
  },

  condition: {
    clear: $localize`:@@condition.clear:Clear`,
    mostlyClear: $localize`:@@condition.mostlyClear:Mostly clear`,
    partlyCloudy: $localize`:@@condition.partlyCloudy:Partly cloudy`,
    overcast: $localize`:@@condition.overcast:Overcast`,
    fog: $localize`:@@condition.fog:Fog`,
    drizzle: $localize`:@@condition.drizzle:Drizzle`,
    freezingDrizzle: $localize`:@@condition.freezingDrizzle:Freezing drizzle`,
    rain: $localize`:@@condition.rain:Rain`,
    freezingRain: $localize`:@@condition.freezingRain:Freezing rain`,
    snow: $localize`:@@condition.snow:Snow`,
    rainShowers: $localize`:@@condition.rainShowers:Rain showers`,
    snowShowers: $localize`:@@condition.snowShowers:Snow showers`,
    thunderstorm: $localize`:@@condition.thunderstorm:Thunderstorm`,
    unknown: $localize`:@@condition.unknown:Unknown`,
  },

  failure: {
    timeout: $localize`:@@failure.timeout:The weather service took too long to answer.`,
    noConnection: $localize`:@@failure.noConnection:Could not reach the weather service. Check your connection.`,
    badResponse: $localize`:@@failure.badResponse:The weather service sent an answer this app could not read.`,
    rejected: $localize`:@@failure.rejected:The weather service refused the request.`,
    unavailable: $localize`:@@failure.unavailable:The weather service is having trouble. Try again in a moment.`,
    invalidPlace: $localize`:@@failure.invalidPlace:That point is not on the map.`,
    unexpected: $localize`:@@failure.unexpected:Something went wrong. Please try again.`,
  },
} as const;
