"use server";

import { dummyStations } from "@/components/DummyLocation";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export async function getNearbyTubes(lon_lat: number[]): Promise<MapLocation[]> {
  const latitude = lon_lat[1];
  const longitude = lon_lat[0];
  const stations: MapLocation[] = [];

  for (const station of dummyStations) {
    if (calculateDistance(latitude, longitude, station.latitude, station.longitude) < 2) {
      stations.push(station);
    }
  }

  return stations;
}