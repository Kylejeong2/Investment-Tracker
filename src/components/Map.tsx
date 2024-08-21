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

interface Group {
  id: string;
  name: string;
  members: User[];
}

interface MapProps {
  currentUser: User | null;
  groups: Group[];
}

export default function Map({ currentUser, groups }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (map.current || !currentUser) return;
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [currentUser.location[0], currentUser.location[1]], // [longitude, latitude]
        zoom: 14
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!map.current || !currentUser) return;

    updateOrAddMarker(currentUser, 'You');

    groups.forEach(group => {
      group.members.forEach(member => {
        if (member.id !== currentUser.id) {
          updateOrAddMarker(member, `${member.name} (${group.name})`);
        }
      });
    });

    // Remove markers for users who are no longer in any group
    Object.keys(markers.current).forEach(markerId => {
      if (markerId !== currentUser.id && !groups.some(group => group.members.some(member => member.id === markerId))) {
        markers.current[markerId].remove();
        delete markers.current[markerId];
      }
    });
  }, [currentUser, groups]);

  const updateOrAddMarker = (user: User, label: string) => {
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
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${label}</h3>`))
        .addTo(map.current!);

      markers.current[user.id] = marker;
    }
  };

  return <div ref={mapContainer} className="w-full h-full" />;
}