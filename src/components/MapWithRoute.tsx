'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import { getRouteDirectionBus } from '@/actions/getRouteDirection';

interface RoutePoint {
  latitude: number;
  longitude: number;
  distance: number;
  time: number;
  mode: string;
}

interface MapRouteCompProps {
  Locations: MapLocation[];
}
const MapRouteComp: React.FC<MapRouteCompProps> = ({ Locations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<atlas.Map | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLon[]>([]);
  const [routePoints, setRoutPoints] = useState<RoutePoint[]>([]);

  // Apply MS map
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
    link.type = 'text/css';
    document.head.appendChild(link);
  }, []); 

  // Fetch the route locations
  useEffect(() => {
    const fetchRoute = async () => {
      const origin = [Number(Locations[0].latitude), Number(Locations[0].longitude)] as LatLon;
      const waypoints = Locations.slice(1, -1).map(property => [Number(property.latitude), Number(property.longitude)] as LatLon);
      const destination = [Number(Locations[Locations.length - 1].latitude), Number(Locations[Locations.length - 1].longitude)] as LatLon;
      
      // Fetch route data
      try {
        const data = JSON.stringify({ origin, waypoints, destination });
        const route = await getRouteDirectionBus(data);
        const newRouteCoords: LatLon[] = [];
        const newRoutePoints: RoutePoint[] = [];
        if (route.legs) {
          for (const leg of route.legs) {
            // get middle points, time and distance for the section
            const middlePoint = {
              latitude: leg.points[Math.floor(leg.points.length / 2)].latitude,
              longitude: leg.points[Math.floor(leg.points.length / 2)].longitude,
              distance: leg.summary.lengthInMeters,
              time: Math.floor(leg.summary.travelTimeInSeconds / 60),
              mode: "walking"
            };
            newRoutePoints.push(middlePoint);
            for (const point of leg.points) {
              newRouteCoords.push([point.latitude, point.longitude]);
            }
          }
          setRoutPoints(newRoutePoints);
          setRouteCoords(newRouteCoords);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };
    fetchRoute();
  }, [Locations]);

  // Initialise the map
  useEffect(() => {
    let map: atlas.Map;
    let datasource: atlas.source.DataSource;
    let popup: atlas.Popup;

    const initializeMap = () => {
      map = new atlas.Map(mapRef.current!, {
        authOptions: {
          authType: atlas.AuthenticationType.anonymous,
          clientId: "149bd4ef-a78f-4fda-b755-f06ba2e99b76", // Azure Maps Client ID
          getToken: async function(resolve, reject, map) {
            try {
              const res = await fetch('/api/get-aad-token');
              const data = await res.json();
              const token = data.access_token;
              // console.log('token: ', token);
              resolve(token);
            } catch (error) {
              console.error('Error fetching AAD token:', error);
              reject(error);
            }
          }
        }
      });

      map.events.add('error', (e) => {
        console.error('Azure Maps error:', e.error);
      });

      map.events.add('styledata', () => {
        console.log('Map style has loaded');
      });

      popup = new atlas.Popup({
        pixelOffset: [0, -30],
        closeButton: false
      });

      map.events.add("ready", () => {
        // Create a data source and add it to the map
        datasource = new atlas.source.DataSource();
        map.sources.add(datasource);

        // Add a layer for rendering the route lines
        map.layers.add(new atlas.layer.LineLayer(datasource, undefined, {
          strokeColor: '#007cbf',
          strokeWidth: 5,
          lineJoin: 'round',
          lineCap: 'round'
        }), 'labels');

        // Add a layer for rendering point data
        const symbolLayer = new atlas.layer.SymbolLayer(datasource, 'SymbolLayer', {
          iconOptions: {
            image: ['get', 'icon'],
            size: 2,
            allowOverlap: true
          },
          textOptions: {
            textField: ['get', 'name'],
            offset: [0, 1.2],
            color: 'black',
            haloColor: 'white',
            haloWidth: 3,
            size: 30
          },
          filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]
        });
        map.layers.add(symbolLayer);

        // Create the GeoJSON objects from the locations
        const points = Locations.map((location: MapLocation) => 
          new atlas.data.Feature(new atlas.data.Point([Number(location.longitude), Number(location.latitude)]), {
            name: location.name || '',
            type: 'hotel',
            icon: 'pin-red',
          })
        );
        datasource.add(points); // Add the data to the data source

        // Create a LineString from the locations
        const lineString = new atlas.data.LineString(routeCoords.map(coord => [coord[1], coord[0]]));
        datasource.add(new atlas.data.Feature(lineString));

        for (const point of routePoints) {
          const travelInfo = new atlas.data.Feature(new atlas.data.Point([Number(point.longitude), Number(point.latitude)]), {
            type: 'routePoint',
            distance: point.distance,
            time: point.time,
            mode: point.mode,
          })
          datasource.add(travelInfo);
        }

        // Add travel info on map
        const routePointLayer = new atlas.layer.SymbolLayer(datasource, 'route-points', {
          iconOptions: {
              image: 'none' // hide the icon
          },
          textOptions: {
              //Change  property value into a string and appends the letter "m" to the end of it.
              textField: ['concat', ['to-string', ['get', 'time']], 'min '],
              offset: [0, -1.2],
              color: '#002aff',
              haloColor: 'white',
              haloWidth: 3,
              size: 30         
            },
          filter: ['==', ['get', 'type'], 'routePoint']
        })
        map.layers.add(routePointLayer);

        // Fit the map window to the bounding box of all points
        map.setCamera({
          bounds: atlas.data.BoundingBox.fromData(points),
          padding: 50
        });

        // Add click event after the layer has been added
        map.events.add('click', symbolLayer, (e: atlas.MapMouseEvent) => {
          if (e.shapes && e.shapes.length > 0) {
            // Reset all points to blue
            datasource.getShapes().forEach((shape) => {
              const Locations = shape.getProperties();
              if (shape.getType() === 'Point') {
                shape.addProperty('icon', 'pin-blue');
              }
            });

            // Set clicked point to red
            const clickedShape = e.shapes[0] as atlas.Shape;
            clickedShape.addProperty('icon', 'pin-red');

            const Locations = clickedShape.getProperties();
            const content = `<div style="padding:10px">
              <b>${Locations.title}</b>
              <br>${Locations.description || ''} </br>
              <a href="${Locations.url || '#'}" target="_blank">More info</a>
            </div>`;

            // Check if the shape is a Feature with Point geometry
            if (clickedShape instanceof atlas.Shape) {

            // Get the coordinate of the clicked shape
            const locations = clickedShape.getCoordinates();
            let position: atlas.data.Position;
            if (Array.isArray(locations)) {
              if (Array.isArray(locations[0])) {
                position = locations[0] as atlas.data.Position;
              } else {
                position = locations as atlas.data.Position;
              }
            } else {
              position = locations as atlas.data.Position;
            }
            popup.setOptions({
              content: content,
              position: position
            })
            popup.open(map);
            } else {
              console.log('Clicked shape is not a point feature')
            }
          } else {
            console.log('No shape clicked')
          }
        });
        setMap(map);
        LimitScrollWheelZoom(map);
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
  }, [Locations, routeCoords]);

  const zoomMap = (offset: number) => (event: React.MouseEvent<HTMLButtonElement>) => {
    if (map) {
      var cam = map.getCamera();
      map.setCamera({
        //Zoom the map within the range of min/max zoom of the map.
        zoom: Math.max(cam.minZoom!, Math.min(cam.maxZoom!, cam.zoom! + offset)),
        type: 'ease',
        duration: 250
      })
    }
  };

  function LimitScrollWheelZoom(map: atlas.Map): void {
    map.setUserInteraction({ scrollZoomInteraction: false });

    // Create a message dialog to tell the user how to zoom the map if they use the scroll wheel on the map without CTRL.
    const msgDialog = document.createElement('div');
    Object.assign(msgDialog.style, {
        display: 'none',
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        transition: 'visibility 0s linear 0s, opacity 1000ms'
    });
    msgDialog.innerHTML = `
    <div style="position:relative;float:left;top:50%;left:50%;transform:translate(-50%,-50%);">
      <p> Use ctrl + scroll to zoom the map </p>
      <br>
      <p> or Use +/- buttons </p>
    </div>`;
    map.getMapContainer().appendChild(msgDialog);

    // Show the message dialog for 2 seconds then fade out over 300ms.
    const showMsgDialog = (): void => {
        msgDialog.style.display = '';
        msgDialog.style.opacity = '1';
        setTimeout(() => {
            msgDialog.style.opacity = '0';
            setTimeout(() => {
                msgDialog.style.display = 'none';
            }, 300);
        }, 700);
    };

    map.getMapContainer().addEventListener('wheel', (e: WheelEvent) => {
        if (!e.ctrlKey) {
            showMsgDialog();
        }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey) {
            map.setUserInteraction({ scrollZoomInteraction: true });
        }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
        if (!e.ctrlKey) {
            map.setUserInteraction({ scrollZoomInteraction: false });
        }
    });
  } 

  return (
    <>
      <div className="mapContainer">
        <div id="myMap" ref={mapRef}></div>
        <div className="controlContainer">
          <button className="navButton" onClick={zoomMap(1)} title="Zoom In">+</button>
          <button className="navButton" onClick={zoomMap(-1)} title="Zoom Out">-</button>
        </div>
      </div>
      <style jsx>{`
        .mapContainer {
          position: relative;
          flex-grow: 1;
          height: 90vh;
        }
        #myMap {
          width: 100%;
          height: 100%;
        }
        .controlContainer {
          position: absolute;
          bottom: 100px;
          right: 10px;
          display: flex;
          flex-direction: column;
        }
        .controlContainer .navButton {
          margin: 2px 0;
          background-color: #fff;
          box-shadow: rgb(0 0 0 / 16%) 0 0 4px;
          border: none;
          border-radius: 2px;
          width: 40px;
          height: 40px;
          padding: 2px 8px;
          color: black;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          text-decoration: none;
          line-height: 24px;
          display: inline-block;
          cursor: pointer;
        }
        .controlContainer .navButton:hover {
          color: deepskyblue;
        }
      `}</style>
    </>
  );
};

export default MapRouteComp;