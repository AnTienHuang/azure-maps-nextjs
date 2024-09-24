"use client";

import React from 'react';
import dynamic from 'next/dynamic';
const MapRouteComp = dynamic(() => import('@/components/MapWithRoute'), { ssr: false });
import { dummyRouteLocations } from '@/components/DummyLocation';

const MapRouteView = () => {
  return (
    <MapRouteComp Locations={dummyRouteLocations} />
  );
};

export default MapRouteView;