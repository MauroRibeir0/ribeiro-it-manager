import React, { useEffect, useRef, useState } from 'react';
import { Client, Visit, VisitStatus } from '../types';
import { MapPin, Navigation } from 'lucide-react';

// Add type declaration for Leaflet global
declare global {
  interface Window {
    L: any;
  }
}

interface ClientMapProps {
  clients: Client[];
  visits: Visit[];
}

const ClientMap: React.FC<ClientMapProps> = ({ clients, visits }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter visits for route visualization
  const daysVisits = visits
    .filter(v => v.date === selectedDate && v.status !== VisitStatus.CANCELLED)
    .sort((a, b) => a.time.localeCompare(b.time));

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      // Centered on Tete, Mozambique
      const map = window.L.map(mapContainerRef.current).setView([-16.1564, 33.5863], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing layers (markers/polylines)
    map.eachLayer((layer: any) => {
      if (!layer._url) { // Keep tile layer
        map.removeLayer(layer);
      }
    });

    // Add Client Markers
    clients.forEach(client => {
      if (client.lat && client.lng) {
        const hasVisitToday = daysVisits.some(v => v.clientId === client.id);
        
        // Custom Marker Logic (Red for regular, Blue for Visit Today)
        const markerColor = hasVisitToday ? 'blue' : 'red';
        
        // Simple SVG Icon creation for Leaflet
        const svgIcon = window.L.divIcon({
          html: `<div style="background-color: ${hasVisitToday ? '#1a1a1a' : '#aa0000'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; color: white; font-size: 10px; font-weight: bold;">${client.name[0]}</div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = window.L.marker([client.lat, client.lng], { icon: svgIcon }).addTo(map);
        
        marker.bindPopup(`
          <b>${client.name}</b><br/>
          ${client.area}<br/>
          ${client.classification}
        `);
      }
    });

    // Draw Route for Selected Date
    if (daysVisits.length > 1) {
      const routePoints: any[] = [];
      daysVisits.forEach(v => {
        const c = clients.find(cl => cl.id === v.clientId);
        if (c && c.lat && c.lng) {
          routePoints.push([c.lat, c.lng]);
        }
      });

      if (routePoints.length > 1) {
        window.L.polyline(routePoints, {
          color: '#1a1a1a',
          weight: 3,
          dashArray: '5, 10',
          opacity: 0.7
        }).addTo(map);
      }
    }

  }, [clients, daysVisits, selectedDate]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Date Selector Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-lg flex gap-2 items-center">
        <Navigation size={20} className="text-ribeiro-red" />
        <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-grow text-sm font-medium outline-none"
        />
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-md font-bold">
            {daysVisits.length} Visitas
        </span>
      </div>

      <div ref={mapContainerRef} className="flex-grow w-full h-full z-0" style={{ minHeight: '400px' }}></div>
      
      {/* Legend */}
      <div className="bg-white p-3 text-xs flex justify-around border-t z-10 mb-16">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ribeiro-red"></div>
            <span>Cliente</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-900"></div>
            <span>Visita Agendada</span>
         </div>
      </div>
    </div>
  );
};

export default ClientMap;