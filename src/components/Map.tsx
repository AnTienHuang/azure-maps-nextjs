'use client';
import React from 'react';
import { useEffect, useRef } from 'react';
import * as atlas from 'azure-maps-control';


const MapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

   // Apply MS map
  useEffect(() => {
    // Create a link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
    link.type = 'text/css';
    document.head.appendChild(link);
  }, []); 

  useEffect(() => {
    let map: atlas.Map;
    let datasource: atlas.source.DataSource;
    // Initialise new map
    const initializeMap = () => {
      map = new atlas.Map(mapRef.current!, {
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
          subscriptionKey: "Your Azure Maps Account Primary Key"
        }
      });
      datasource = new atlas.source.DataSource();
      map.events.add("ready", () => {
        map.sources.add(datasource);
      });
    };
    if (mapRef.current) {
      initializeMap();
    }
    return () => {
      if (map) {
        map.dispose();
      }
    };
  }, []);
  
  return (
    <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
  );
};

export default MapPage;
