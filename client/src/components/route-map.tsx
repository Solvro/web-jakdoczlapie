import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop, Track, Report } from '@shared/schema';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  stops?: Stop[];
  tracks?: Track[];
  reports?: Report[];
  selectedCoordinates?: { latitude: number; longitude: number } | null;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function RouteMap({
  stops = [],
  tracks = [],
  reports = [],
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
  const trackPolylineRef = useRef<L.Polyline | null>(null);
  const trackMarkersRef = useRef<L.Marker[]>([]);
  const reportMarkersRef = useRef<L.Marker[]>([]);
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
      }
    }
  }, [stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    trackMarkersRef.current.forEach(marker => marker.remove());
    trackMarkersRef.current = [];

    if (trackPolylineRef.current) {
      trackPolylineRef.current.remove();
      trackPolylineRef.current = null;
    }

    if (tracks.length > 0) {
      const trackCoordinates: [number, number][] = [];

      tracks
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .forEach((track, index) => {
          if (track.coordinates) {
            const lat = track.coordinates.latitude;
            const lng = track.coordinates.longitude;
            trackCoordinates.push([lat, lng]);

            if (index === tracks.length - 1) {
              const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'custom-track-marker',
                  html: `<div style="background: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                }),
              }).addTo(map);

              marker.bindPopup(`<b>Ostatnia pozycja</b><br/><small>${new Date(track.created_at).toLocaleString('pl-PL')}</small>`);
              trackMarkersRef.current.push(marker);
            }
          }
        });

      if (trackCoordinates.length > 1) {
        trackPolylineRef.current = L.polyline(trackCoordinates, {
          color: '#10b981',
          weight: 4,
          opacity: 0.8,
        }).addTo(map);

        const allBounds: L.LatLngBounds[] = [];
        if (polylineRef.current) {
          allBounds.push(polylineRef.current.getBounds());
        }
        if (trackPolylineRef.current) {
          allBounds.push(trackPolylineRef.current.getBounds());
        }

        if (allBounds.length > 0) {
          const combinedBounds = allBounds[0];
          allBounds.slice(1).forEach(bounds => combinedBounds.extend(bounds));
          map.fitBounds(combinedBounds, {
            padding: [50, 50],
          });
        }
      } else if (trackCoordinates.length === 1) {
        if (stops.length === 0) {
          map.setView(trackCoordinates[0], 14);
        }
      }
    }
  }, [tracks, stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    reportMarkersRef.current.forEach(marker => marker.remove());
    reportMarkersRef.current = [];

    if (reports.length > 0) {
      reports.forEach(report => {
        if (report.coordinates) {
          const lat = report.coordinates.latitude;
          const lng = report.coordinates.longitude;

          const getReportColor = (type?: string) => {
            if (!type) return '#f59e0b';
            if (['accident', 'failure', 'did_not_arrive'].includes(type)) return '#ef4444';
            if (['delay', 'press'].includes(type)) return '#f59e0b';
            return '#3b82f6';
          };

          const getReportLabel = (type?: string) => {
            const labels: Record<string, string> = {
              delay: 'Opóźnienie',
              accident: 'Wypadek',
              failure: 'Awaria',
              press: 'Tłok',
              did_not_arrive: 'Nie dojechał',
            };
            return labels[type || ''] || type || 'Zgłoszenie';
          };

          const color = getReportColor(report.type);
          
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-report-marker',
              html: `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          }).addTo(map);

          const popupContent = `
            <div style="min-width: 150px;">
              <b>${getReportLabel(report.type)}</b><br/>
              ${report.description ? `<p style="margin: 4px 0; font-size: 12px;">${report.description}</p>` : ''}
              ${report.run ? `<small>Kurs #${report.run}</small><br/>` : ''}
              ${report.created_at ? `<small>${new Date(report.created_at).toLocaleString('pl-PL')}</small>` : ''}
            </div>
          `;
          
          marker.bindPopup(popupContent);
          reportMarkersRef.current.push(marker);
        }
      });
    }
  }, [reports]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const allBounds: L.LatLngBounds[] = [];

    if (polylineRef.current) {
      allBounds.push(polylineRef.current.getBounds());
    }
    
    if (trackPolylineRef.current) {
      allBounds.push(trackPolylineRef.current.getBounds());
    }

    const reportCoordinates: [number, number][] = [];
    reports.forEach(report => {
      if (report.coordinates) {
        reportCoordinates.push([report.coordinates.latitude, report.coordinates.longitude]);
      }
    });

    if (reportCoordinates.length > 0) {
      const reportBounds = L.latLngBounds(reportCoordinates);
      allBounds.push(reportBounds);
    }

    if (allBounds.length > 0) {
      const combinedBounds = allBounds[0];
      allBounds.slice(1).forEach(bounds => combinedBounds.extend(bounds));
      map.fitBounds(combinedBounds, { padding: [50, 50] });
    } else if (reportCoordinates.length === 1) {
      map.setView(reportCoordinates[0], 14);
    } else {
      const stopCoordinates: [number, number][] = [];
      stops.forEach(stop => {
        if (stop.coordinates) {
          stopCoordinates.push([stop.coordinates.latitude, stop.coordinates.longitude]);
        }
      });
      
      if (stopCoordinates.length === 1) {
        map.setView(stopCoordinates[0], 13);
      }
    }
  }, [stops, tracks, reports]);

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
