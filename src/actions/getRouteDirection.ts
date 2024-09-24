"use server"

import { AzureKeyCredential } from "@azure/core-auth";
import MapsRoute, {
    isUnexpected,
    toColonDelimitedLatLonString,
} from "@azure-rest/maps-route";

export async function getRouteDirection(data: string): Promise<RouteDirectionsOutput> {
  if (!process.env.AZURE_MAPS_SUBSCRIPTION_KEY) {
    throw new Error("AZURE_MAPS_SUBSCRIPTION_KEY is not defined");
  }

  const credential = new AzureKeyCredential(process.env.AZURE_MAPS_SUBSCRIPTION_KEY);
  const client = MapsRoute(credential);
  // Decode the input data
  const prop: RouteDirectionsProps = JSON.parse(data);
  const { origin, destination, waypoints } = prop;
  // console.log('prop', prop);
  if (!origin || !destination) {
    return {summary: null, legs: null, sections: null};
  }
  
  const queryPoints: LatLon[] = [origin];
  if (waypoints && waypoints.length > 0) {
    queryPoints.push(...waypoints);
  }
  
  queryPoints.push(destination);
  // console.log(queryPoints);
  const routeDirectionsResult = await client.path("/route/directions/{format}", "json").get({
    queryParameters: {
      query: toColonDelimitedLatLonString(queryPoints),
      computeBestOrder: true,
      routeType: "fastest",
      travelMode: "pedestrian",
    },
  });

  if (isUnexpected(routeDirectionsResult)) {
    return {summary: null, legs: null, sections: null};
  }
  return routeDirectionsResult.body.routes[0] as RouteDirectionsOutput;
}

export async function getRouteDirectionBus(data: string): Promise<RouteDirectionsOutput> {
  if (!process.env.AZURE_MAPS_SUBSCRIPTION_KEY) {
    throw new Error("AZURE_MAPS_SUBSCRIPTION_KEY is not defined");
  }

  const credential = new AzureKeyCredential(process.env.AZURE_MAPS_SUBSCRIPTION_KEY);
  const client = MapsRoute(credential);
  // Decode the input data
  const prop: RouteDirectionsProps = JSON.parse(data);
  const { origin, destination, waypoints } = prop;
  // console.log('prop', prop);
  if (!origin || !destination) {
    return {summary: null, legs: null, sections: null};
  }
  
  const queryPoints: LatLon[] = [origin];
  if (waypoints && waypoints.length > 0) {
    queryPoints.push(...waypoints);
  }
  
  queryPoints.push(destination);
  // console.log(queryPoints);
  const routeDirectionsResult = await client.path("/route/directions/{format}", "json").get({
    queryParameters: {
      query: toColonDelimitedLatLonString(queryPoints),
      computeBestOrder: true,
      routeType: "fastest",
      travelMode: "bus",
    },
  });

  if (isUnexpected(routeDirectionsResult)) {
    return {summary: null, legs: null, sections: null};
  }
  return routeDirectionsResult.body.routes[0] as RouteDirectionsOutput;
}