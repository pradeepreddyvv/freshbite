'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapRestaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine?: string;
  type?: string;       // "restaurant" | "fast_food" | "cafe"
  source?: string;     // "osm" | "freshbite"
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
}

interface Props {
  restaurants: MapRestaurant[];
  userLocation: { lat: number; lng: number } | null;
  mapCenter?: { lat: number; lng: number } | null;
  onRestaurantClick?: (id: string) => void;
  selectedId?: string | null;
}

const CARTO_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283]; // center of USA
const DEFAULT_ZOOM = 4;

// Pin colors by type
const PIN_COLORS: Record<string, string> = {
  restaurant: '#ef4444',   // red
  fast_food: '#f59e0b',    // amber
  cafe: '#8b5cf6',         // purple
  freshbite: '#16a34a',    // green (our DB)
};
const PIN_EMOJIS: Record<string, string> = {
  restaurant: '🍽️',
  fast_food: '🍔',
  cafe: '☕',
  freshbite: '⭐',
};

export default function RestaurantDiscoveryMap({
  restaurants,
  userLocation,
  mapCenter,
  onRestaurantClick,
  selectedId,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const center: [number, number] = mapCenter
      ? [mapCenter.lng, mapCenter.lat]
      : userLocation
        ? [userLocation.lng, userLocation.lat]
        : DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: CARTO_STYLE,
      center,
      zoom: mapCenter || userLocation ? 13 : DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new map center when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapCenter) return;
    map.flyTo({ center: [mapCenter.lng, mapCenter.lat], zoom: 13, duration: 1500 });
  }, [mapCenter]);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.style.cssText = `
      width: 18px; height: 18px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML('<strong>📍 You are here</strong>'))
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLocation]);

  // Update restaurant markers
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const mappable = restaurants.filter(
      (r) => r.latitude != null && r.longitude != null
    );

    mappable.forEach((restaurant) => {
      const isSelected = restaurant.id === selectedId;
      const pinType = restaurant.source === 'freshbite' ? 'freshbite' : (restaurant.type || 'restaurant');
      const color = isSelected ? '#0ea5e9' : (PIN_COLORS[pinType] || '#ef4444');
      const emoji = PIN_EMOJIS[pinType] || '🍽️';

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${isSelected ? '34px' : '28px'}; 
        height: ${isSelected ? '34px' : '28px'};
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        font-size: ${isSelected ? '16px' : '13px'};
        transition: all 0.15s;
      `;
      el.innerHTML = emoji;
      el.title = restaurant.name;

      const distText = restaurant.distanceKm != null
        ? `<br/><span style="color:#6b7280;font-size:11px;">📏 ${restaurant.distanceKm} km</span>`
        : '';
      const cuisineText = restaurant.cuisine
        ? `<br/><span style="color:#6b7280;font-size:11px;">🍴 ${restaurant.cuisine}</span>`
        : '';
      const typeLabel = pinType === 'fast_food' ? 'Fast Food' : pinType === 'cafe' ? 'Café' : pinType === 'freshbite' ? '⭐ On FreshBite' : 'Restaurant';

      const popup = new maplibregl.Popup({ offset: 18, closeButton: false })
        .setHTML(`
          <div style="max-width:220px;">
            <strong style="font-size:13px;">${restaurant.name}</strong>
            <br/><span style="color:#9ca3af;font-size:10px;">${typeLabel}</span>
            <br/><span style="color:#6b7280;font-size:11px;">${restaurant.address || restaurant.city ? '📍 ' : ''}${restaurant.address || ''}${restaurant.address && restaurant.city ? ', ' : ''}${restaurant.city || ''}</span>
            ${cuisineText}${distText}
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([restaurant.longitude!, restaurant.latitude!])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onRestaurantClick?.(restaurant.id);
      });

      if (isSelected) {
        marker.togglePopup();
        popupRef.current = popup;
      }

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (mappable.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      mappable.forEach((r) => bounds.extend([r.longitude!, r.latitude!]));
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    }
  }, [restaurants, selectedId, userLocation, onRestaurantClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.loaded()) {
      updateMarkers();
    } else {
      map.on('load', updateMarkers);
      return () => { map.off('load', updateMarkers); };
    }
  }, [updateMarkers]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden border border-gray-200"
      style={{ minHeight: '400px' }}
    />
  );
}
