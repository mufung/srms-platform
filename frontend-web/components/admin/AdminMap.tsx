// ============================================================
// SRMS-1-MAP-001: Admin Location Map Component
// Owner: MUFUNG ANGELBELL MBUYEH
// Description: Interactive map showing Yaoundé, Cameroon
// Uses Leaflet.js (free, no API key needed)
// ============================================================

'use client';

import { useEffect, useRef } from 'react';

interface AdminMapProps {
  latitude: number;
  longitude: number;
  ownerName: string;
  ownerTitle: string;
  ownerLocation: string;
}

// ============================================================
// SRMS-1-MAP-010: MAP COMPONENT
// ============================================================
export default function AdminMap({ latitude, longitude, ownerName, ownerTitle, ownerLocation }: AdminMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // SRMS-1-MAP-011: Only initialize on client side (Leaflet doesn't support SSR)
    if (typeof window === 'undefined') return;
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    // SRMS-1-MAP-012: Dynamic import of Leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // SRMS-1-MAP-013: Fix marker icon issue in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // SRMS-1-MAP-014: Initialize map centered on Yaoundé, Cameroon
      const map = L.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false, // Prevent accidental zoom when scrolling page
      });

      // SRMS-1-MAP-015: Dark theme tile layer (matches SRMS design)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // SRMS-1-MAP-016: Custom marker for owner location
      const customIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: 3px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          ">
            🏠
          </div>
          <div style="
            width: 2px;
            height: 16px;
            background: #f59e0b;
            margin: 0 auto;
          "></div>
        `,
        iconSize: [48, 64],
        iconAnchor: [24, 64],
        popupAnchor: [0, -64],
      });

      // SRMS-1-MAP-017: Add marker at owner's location
      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

      // SRMS-1-MAP-018: Popup with owner information
      marker.bindPopup(`
        <div style="
          font-family: 'DM Sans', system-ui, sans-serif;
          min-width: 220px;
          color: #e2e8f0;
        ">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; color: #f59e0b;">
            ${ownerName}
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">${ownerTitle}</div>
          <div style="font-size: 12px; color: #94a3b8;">📍 ${ownerLocation}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">✉️ mufungangelbellmbuyeh@gmail.com</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">💬 +237 671 534 067</div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; color: #64748b;">
            SRMS Platform Owner | AWS Solutions Architect
          </div>
        </div>
      `, {
        className: 'srms-map-popup',
        maxWidth: 280,
      }).openPopup();

      // SRMS-1-MAP-019: Add circle to highlight the area
      L.circle([latitude, longitude], {
        radius: 500,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap().catch(console.error);

    // SRMS-1-MAP-020: Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, ownerName, ownerTitle, ownerLocation]);

  return (
    <div
      ref={mapRef}
      className="map-container w-full"
      style={{ height: '300px' }}
    />
  );
}