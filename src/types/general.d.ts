type LatLon = [latitude: number, longitude: number];

interface MapLocation {
  name: string;
  latitude: number;
  longitude: number;
}

type TravelMode =
  | "car"
  | "truck"
  | "taxi"
  | "bus"
  | "van"
  | "motorcycle"
  | "bicycle"
  | "pedestrian";

type RouteType = "fastest" | "shortest" | "eco" | "thrilling" | undefined;

interface RouteDirectionsOutput {
  summary: RouteSummary | null;
  legs: RouteLeg[] | null;
  sections: RouteSection[] | null;
}

interface RouteSummary {
  lengthInMeters: number;
  travelTimeInSeconds: number;
  trafficDelayInSeconds: number;
  trafficLengthInMeters: number;
  departureTime: string;
  arrivalTime: string;
}

interface RouteLeg {
  summary: LegSummary;
  points: GeoPoint[];
}

interface LegSummary extends RouteSummary {
  originalWaypointIndexAtEndOfLeg?: number;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface RouteSection {
  startPointIndex: number;
  endPointIndex: number;
  sectionType: string;
  travelMode: string;
}

interface RouteDirectionsProps {
  origin?: LatLon;
  waypoints?: LatLon[];
  destination?: LatLon;
  routeType?: "fastest" | "shortest" | "eco" | "thrilling";
  travelMode?: TravelMode;
  computeBestOrder?: boolean;
}
