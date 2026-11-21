import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import maplibregl, { type LngLat, type MapMouseEvent, type MapTouchEvent, type Point } from 'maplibre-gl';

import { messages } from '../../../l10n/messages';

/** Where the pin goes. */
export interface MapPin {
  readonly latitude: number;
  readonly longitude: number;
}

/** How much of each edge of the map something else is covering, in pixels. */
export interface MapInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** OpenFreeMap's hosted styles: free, no key, and no request limit. */
const styleUrl = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

const view = {
  initialCenter: [0, 25] as [number, number],
  initialZoom: 1.5,
  minZoom: 1,
  maxZoom: 18,
  /** How far in the map goes when a place is chosen from further out. */
  placeZoom: 10,
  moveDurationMs: 600,
} as const;

/** How long a press must be held, and how far it may wander, to count. */
const longPressMs = 500;
const longPressSlopPx = 8;

/**
 * The map behind everything else, drawn with MapLibre GL JS. A press held in
 * one spot picks the point under it.
 */
@Component({
  selector: 'app-weather-map',
  template: `<div #container class="map" role="application" [attr.aria-label]="label"></div>`,
  styles: `
    :host,
    .map {
      position: absolute;
      inset: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherMapComponent {
  /** Where the pin goes, or null for no pin. */
  readonly pin = input<MapPin | null>(null);
  /**
   * The parts of the map the search bar and forecast cover. The pin is put
   * in the middle of what is left.
   */
  readonly covered = input<MapInsets>({ top: 0, right: 0, bottom: 0, left: 0 });
  readonly dark = input(false);
  /** A press-and-hold on the map, at the point under it. */
  readonly longPress = output<MapPin>();

  protected readonly label = messages.map.label;

  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private map: maplibregl.Map | undefined;
  private marker: maplibregl.Marker | undefined;

  /** The style the map was last given, so the same one is not loaded twice. */
  private shownStyle: string | undefined;

  constructor() {
    afterNextRender(() => this.create());
    inject(DestroyRef).onDestroy(() => this.map?.remove());

    effect(() => this.showStyle(this.dark()));
    // The pin is in the theme's colour, so it is drawn again when the theme changes.
    effect(() => this.showPin(this.pin(), this.dark()));
    // Selecting a place, or a change in what covers the map, moves the map
    // so the pin sits in the clear.
    effect(() => this.moveTo(this.pin(), this.covered()));
  }

  private create(): void {
    this.shownStyle = this.dark() ? styleUrl.dark : styleUrl.light;
    const map = new maplibregl.Map({
      container: this.container().nativeElement,
      style: this.shownStyle,
      center: view.initialCenter,
      zoom: view.initialZoom,
      minZoom: view.minZoom,
      maxZoom: view.maxZoom,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      // The credit is drawn by the page, where the forecast cannot cover it.
      attributionControl: false,
    });
    map.touchZoomRotate.disableRotation();
    watchForLongPress(map, ({ lat, lng }) => this.longPress.emit({ latitude: lat, longitude: lng }));
    this.map = map;

    // A place may have been chosen before the map existed.
    this.showPin(this.pin(), this.dark());
    this.moveTo(this.pin(), this.covered());
  }

  private showStyle(dark: boolean): void {
    const style = dark ? styleUrl.dark : styleUrl.light;
    if (this.map === undefined || style === this.shownStyle) return;
    this.shownStyle = style;
    this.map.setStyle(style);
  }

  private showPin(pin: MapPin | null, _dark: boolean): void {
    this.marker?.remove();
    this.marker = undefined;
    if (pin === null || this.map === undefined) return;
    const color = getComputedStyle(this.container().nativeElement).getPropertyValue('--app-primary').trim();

    // The default marker is a pin whose tip sits on the point.
    this.marker = new maplibregl.Marker({ color }).setLngLat([pin.longitude, pin.latitude]).addTo(this.map);
    this.marker.getElement().setAttribute('aria-label', messages.map.selectedPlace);
  }

  private moveTo(pin: MapPin | null, covered: MapInsets): void {
    if (pin === null || this.map === undefined) return;
    this.map.easeTo({
      center: [pin.longitude, pin.latitude],
      zoom: Math.max(this.map.getZoom(), view.placeZoom),
      padding: covered,
      duration: view.moveDurationMs,
    });
  }
}

/**
 * MapLibre GL JS has no long-press event, so one is made from a press that
 * is held in one spot.
 */
function watchForLongPress(map: maplibregl.Map, onLongPress: (lngLat: LngLat) => void): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let start: Point | undefined;

  const cancel = () => {
    clearTimeout(timer);
    start = undefined;
  };
  const begin = (event: MapMouseEvent | MapTouchEvent) => {
    cancel();
    // A second finger means a pinch, not a press.
    if ('points' in event && event.points.length > 1) return;
    start = event.point;
    timer = setTimeout(() => onLongPress(event.lngLat), longPressMs);
  };
  const moved = (event: MapMouseEvent | MapTouchEvent) => {
    if (start !== undefined && start.dist(event.point) > longPressSlopPx) cancel();
  };

  map.on('mousedown', begin);
  map.on('touchstart', begin);
  map.on('mousemove', moved);
  map.on('touchmove', moved);
  map.on('mouseup', cancel);
  map.on('touchend', cancel);
  map.on('touchcancel', cancel);
  map.on('movestart', cancel);
  // A held press must not also open the browser's own menu.
  map.on('contextmenu', (event: MapMouseEvent) => event.preventDefault());
}
