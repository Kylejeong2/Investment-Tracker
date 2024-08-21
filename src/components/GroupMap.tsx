'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface User {
  id: string;
  name: string;
  location: [number, number]; // [longitude, latitude]
  profilePicture: string;
}

interface GroupMapProps {
  groupMembers: User[];
}

export default function GroupMap({ groupMembers }: GroupMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (map.current) return;
    if (mapContainer.current && groupMembers.length > 0) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: groupMembers[0].location,
        zoom: 12
      });
    }
  }, [groupMembers]);

  useEffect(() => {
    if (!map.current) return;

    groupMembers.forEach(member => {
      updateOrAddMarker(member);
    });

    // Remove markers for users who are no longer in the group
    Object.keys(markers.current).forEach(markerId => {
      if (!groupMembers.some(member => member.id === markerId)) {
        markers.current[markerId].remove();
        delete markers.current[markerId];
      }
    });

    // Fit map to show all markers
    const bounds = new mapboxgl.LngLatBounds();
    groupMembers.forEach(member => bounds.extend(member.location));
    map.current.fitBounds(bounds, { padding: 50 });
  }, [groupMembers]);

  const updateOrAddMarker = (user: User) => {
    if (markers.current[user.id]) {
      markers.current[user.id].setLngLat(user.location);
    } else {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = `url(${user.profilePicture})`;
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.backgroundSize = 'cover';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(user.location)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${user.name}</h3>`))
        .addTo(map.current!);

      markers.current[user.id] = marker;
    }
  };

  return <div ref={mapContainer} className="w-full h-full" />;
}