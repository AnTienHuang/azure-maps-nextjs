import React from 'react';
import dynamic from 'next/dynamic';
const MapPage = dynamic(() => import('@/components/MapWithList/MapWithList'), { ssr: false });
import { dummyListLocations } from '@/components/DummyLocation';

const MapView = () => {
  return (
    <MapPage Locations={dummyListLocations}/>
  );
};

export default MapView;