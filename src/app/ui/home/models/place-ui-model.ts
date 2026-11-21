import type { Place } from '../../../domain/models/place';
import { messages } from '../../../l10n/messages';

/**
 * A place as the screen shows it: in a search result, in the search bar, as
 * the forecast's heading and as the pin on the map.
 */
export interface PlaceUiModel {
  /** "Asheville", or "35.60°N, 82.55°W" for a place with no name. */
  readonly title: string;
  /** "North Carolina, United States", or empty when nothing more is known. */
  readonly subtitle: string;
  /** Where the pin goes. */
  readonly latitude: number;
  readonly longitude: number;
}

export function placeUiModelFrom(place: Place): PlaceUiModel {
  return {
    title: place.name ?? coordinatesLabel(place.latitude, place.longitude),
    subtitle: [place.region, place.country].filter((part) => part !== undefined).join(', '),
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

/** How many decimal places of a degree are shown: about a kilometre. */
const coordinateDecimals = 2;

/** "35.60°N, 82.55°W": what a place with no name is called. */
function coordinatesLabel(latitude: number, longitude: number): string {
  // The side is read off the rounded figure, so a point a hair south of the
  // equator is "0.00°N" like the equator itself.
  const north = Number(latitude.toFixed(coordinateDecimals)) >= 0;
  const east = Number(longitude.toFixed(coordinateDecimals)) >= 0;
  const degrees = (value: number) => Math.abs(value).toFixed(coordinateDecimals);

  return messages.place.coordinates(
    north ? messages.place.north(degrees(latitude)) : messages.place.south(degrees(latitude)),
    east ? messages.place.east(degrees(longitude)) : messages.place.west(degrees(longitude)),
  );
}
