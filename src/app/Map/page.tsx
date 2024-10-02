"use client";

import React from 'react';
import dynamic from 'next/dynamic';
const MapPage = dynamic(() => import('@/components/Map'), { ssr: false });

const MapView = () => {
  return (
    <MapPage/>
  );
};

export default MapView;