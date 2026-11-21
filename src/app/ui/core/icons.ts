import { addIcons } from 'ionicons';
import {
  cloud,
  cloudOfflineOutline,
  cloudyNight,
  earthOutline,
  handLeftOutline,
  helpCircleOutline,
  locationOutline,
  moon,
  partlySunny,
  rainy,
  refresh,
  reorderThree,
  searchOutline,
  snow,
  sunny,
  thunderstorm,
  umbrella,
  water,
} from 'ionicons/icons';

/**
 * Makes the icons the app draws known to `ion-icon` by name. Only these are
 * bundled; the rest of Ionicons is left out.
 */
export function registerIcons(): void {
  addIcons({
    cloud,
    cloudOfflineOutline,
    cloudyNight,
    earthOutline,
    handLeftOutline,
    helpCircleOutline,
    locationOutline,
    moon,
    partlySunny,
    rainy,
    refresh,
    reorderThree,
    searchOutline,
    snow,
    sunny,
    thunderstorm,
    umbrella,
    water,
  });
}
