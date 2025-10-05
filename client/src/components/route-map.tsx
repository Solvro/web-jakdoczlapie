import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop } from '@shared/schema';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  stops?: Stop[];
  selectedCoordinates?: { latitude: number; longitude: number } | null;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function RouteMap({
  stops = [],
  selectedCoordinates,
  onLocationSelect,
  center = [50.5, 18.0],
  zoom = 10,
  className = '',
}: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (stops.length > 0) {
      const coordinates: [number, number][] = [];

      stops.forEach(stop => {
        if (stop.coordinates) {
          const lat = stop.coordinates.latitude;
          const lng = stop.coordinates.longitude;
          coordinates.push([lat, lng]);

          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-stop-marker',
              html: `<div style="background: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            }),
          }).addTo(map);

          marker.bindPopup(`<b>${stop.name}</b>`);
          markersRef.current.push(marker);
        }
      });

      if (coordinates.length > 1) {
        polylineRef.current = L.polyline(coordinates, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
        }).addTo(map);

        map.fitBounds(polylineRef.current.getBounds(), {
          padding: [50, 50],
        });
      } else if (coordinates.length === 1) {
        map.setView(coordinates[0], 13);
      }
    }
  }, [stops]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedCoordinates) {
      const { latitude, longitude } = selectedCoordinates;

      selectedMarkerRef.current = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'custom-selected-marker',
          html: `<div style="background: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      });
      
      if (mapRef.current) {
        selectedMarkerRef.current.addTo(mapRef.current);
      }

      selectedMarkerRef.current.bindPopup('<b>Wybrana lokalizacja</b>');

      if (stops.length === 0) {
        mapRef.current.setView([latitude, longitude], 14);
      }
    }
  }, [selectedCoordinates, stops]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="map-container"
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  );
}
