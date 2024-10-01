'use client';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import { getNearbyTubes } from '@/actions/getNearbyTubes';
import { getRouteDirection } from '@/actions/getRouteDirection';
import styles from './PropertyCard.module.css';

interface MapProps {
  Locations: MapLocation[];
}

const MapPage: React.FC<MapProps> = ({ Locations }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [resultList, setResultList] = useState<JSX.Element[]>([]);
  const currentHotelRef = useRef<atlas.Shape | null>(null); 
  const [hotelIdToShapeIdMap, setHotelIdToShapeIdMap] = useState<Map<string, string>>(new Map());
  const [map, setMap] = useState<atlas.Map | null>(null);
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
    let popup: atlas.Popup;
    // if (!mapRef.current) return;
    // Initialise new map
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
      datasource = new atlas.source.DataSource();
      map.events.add("ready", () => {
        map.sources.add(datasource);
        const highlightListItem = (e: any) => {
          const elm = getListItemById(e.shapes[0].getId());
          if (elm) {
            elm.style.backgroundColor = 'LightGreen';
          }
          map.getCanvasContainer().style.cursor = 'pointer';
        };

        const getListItemById = (id: string) => {
          const list = document.getElementById('resultList');
          if (!list) return null;
          const listItems = list.getElementsByTagName('tr');
          if (!listItems) return null;
          for (let i = 0, len = listItems.length; i < len; i++) {
            const rel = listItems[i].getAttribute('rel');
            if (rel === id) {
              return listItems[i];
            }
          }
          return null;
        }; 
        var iconPromises = [
          map.imageSprite.add('underground_icon', '/map_icons/metro.png'),
          map.imageSprite.add('hotel_red_icon', '/map_icons/hotel_red.png'),
        ];
        Promise.all(iconPromises).then(function () {
          const popup = new atlas.Popup();
          // Add hotel layer
          const symbolLayer = new atlas.layer.SymbolLayer(datasource, 'symbolLayer', {
            iconOptions: { 
              image: [
                'match',
                ['get', 'type'],
                //For each entity type, specify the icon name to use.
                'tube', 'underground_icon',
                'hotel', 'hotel_red_icon',
                'hotel_red_icon' //Default icon
            ],
              allowOverlap: false,
              size: 0.1
            },
            textOptions: {
              textField: ['get', 'title'],
              font: ['SegoeUi-SemiBold'],
              size: 28,
              color: '#03088f',
              haloColor: 'rgba(255,255,255,1)',
              haloWidth: 3,
              haloBlur: 3,
              offset: [0, 0.6]
            },
            filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]
          });          
          map.layers.add(symbolLayer);
          // Add hotel points
          const hotelPoints = Locations.map((property: MapLocation) => 
            new atlas.data.Feature(new atlas.data.Point([Number(property.longitude), Number(property.latitude)]), {
              type: 'hotel',
              name: property.name,
            })
          );
          datasource.add(hotelPoints);
          const hotelShapes = datasource.getShapes();
          const hotelIdToShapeIdMap = new Map<string, string>();
          hotelShapes.forEach((shape) => {
            const properties = shape.getProperties();
            if (properties.name) {
              hotelIdToShapeIdMap.set(properties.name, shape.getId() as string);
            }
          });
          setHotelIdToShapeIdMap(hotelIdToShapeIdMap);

          map.setCamera({
            center: hotelShapes[0].getCoordinates(),
            zoom: 15
          }); 
          // Add route layer
          const routeLayer = new atlas.layer.LineLayer(datasource, 'routeLayer', {
            strokeColor: '#0059ff',
            strokeWidth: 5,
            lineJoin: 'round',
            lineCap: 'round'
          });
          map.layers.add(routeLayer, 'labels');
          // add click event
          async function shapeClick(clickedShape: atlas.Shape) {
            const properties = clickedShape.getProperties();
            const position = clickedShape.getCoordinates() as atlas.data.Position;
            
            // Event handler for clicking on a property
            if (properties.type.includes('hotel')) {
              currentHotelRef.current = clickedShape;
              // Open popup
              showPopup(clickedShape);
              // Close any existing route
              datasource.remove('routeLine');

              // Get and add nearby tube stations
              getNearbyTubes(position).then((tubes) => {
                const tubePoints = tubes.map((tube: MapLocation) => 
                  new atlas.data.Feature(new atlas.data.Point([tube.longitude, tube.latitude]), {
                    title: tube.name || '',
                    type: 'tube',
                    popupTemplate: {
                      content: [[{ propertyPath: 'title', label: ' ' }]]
                    }
                  })
                );
                datasource.add(tubePoints);
              });
            } else if (properties.type === 'tube') { 
              // Clicked on a tube station
              if (!currentHotelRef.current) return;
              const origin_coord_raw = currentHotelRef.current.getCoordinates() as atlas.data.Position;
              const origin_coord = [origin_coord_raw[1], origin_coord_raw[0]] as LatLon;
              const destination_coord = [position[1], position[0]] as LatLon;
              try {
                const data = JSON.stringify({ origin: origin_coord, destination: destination_coord });
                const route = await getRouteDirection(data);
                // Extract route coordinates
                const newRouteCoords: LatLon[] = [];
                if (route.legs && route.summary) {
                  for (const leg of route.legs) {
                    for (const point of leg.points) {
                      newRouteCoords.push([point.latitude, point.longitude]);
                    }
                  }
                  // Update the route on the map
                  datasource.remove('routeLine')
                  datasource.add(new atlas.data.Feature(new atlas.data.LineString(newRouteCoords.map(coord => [coord[1], coord[0]])), {
                    strokeColor: '#007cbf',
                    strokeWidth: 5
                  }, 'routeLine'));
                  const position = clickedShape.getCoordinates() as atlas.data.Position;
                  // Open route info popup
                  const content = `
                  <div style="padding:10px; color:white; font-size:20px;">
                  Walking distance: ${route.summary.lengthInMeters} m
                  <br>
                  Walking time: ${Math.floor(route.summary.travelTimeInSeconds / 60)} min
                  </div>
                  `;
                  popup.setOptions({
                    content: content,
                    position: position,
                    fillColor: 'rgba(0,0,0,0.9)',
                    pixelOffset: [0, -60],
                    closeButton: false
                  });
                  popup.open(map); 
                }
              } catch (error) {
                console.error('Error fetching route to tube station:', error);
              }
            }
          }
          const handleShapeClick = async (e: atlas.MapMouseEvent) => {
            if (e.shapes && e.shapes.length > 0) {
              const clickedShape = e.shapes[0] as atlas.Shape;
              if ('getProperties' in clickedShape) {
                shapeClick(clickedShape);
              }
            }
          };
          // Type-safe event handler
          const mapClickHandler = (e: atlas.MapMouseEvent | any) => {
            handleShapeClick(e as atlas.MapMouseEvent);
          };

          // Set hotel list
          const setHotelListHTML = (properties: MapLocation[]) => {
            popup.close();
            const pageInfo = document.getElementById('pageInfo');
            if (!pageInfo) return;
            pageInfo.innerText = `Results: ${properties.length} hotels`;
            const listHTML: JSX.Element[] = [
              <div key="resultsContainer" className={styles.cardContainer}>
                {properties.map((property) => (
                  <div 
                    key={property.name}
                    className={styles.card}
                    onClick={() => listItemClick(property.name)}
                    onMouseLeave={() => closePopups()}
                  >
                    <h3 
                      className={styles.cardTitle}
                      onMouseOver={() => listItemHover(property.name)}
                    >
                      {property.name}
                    </h3>
                    <button
                      className={styles.cardButton}
                      onClick={(event) => {
                        event.stopPropagation(); // Prevent triggering the card's onClick
                      }}
                    >
                      Dummy Button
                    </button>
                  </div>
                ))}
              </div>
            ];
            setResultList(listHTML);
          };
          setHotelListHTML(Locations);

          // Set popup event for hotel list
          const showPopup = (shape: any) => {
            popup.close();
            const hotel = shape.getProperties();
            popup.setOptions({
              content: `
                <div style="padding:10px;">
                  <b>${hotel.name}</b>
                </div>`,
              position: shape.getCoordinates(),
              closeButton: false,
              fillColor: 'rgba(0,0,0,0.9)',
            });
            popup.open(map);
          };

          const closePopups = () => {
            map.popups.clear();
          }
                    
          const listItemHover = (id?: string) => {
            const shapeId = id && hotelIdToShapeIdMap.get(id);
            const shape = shapeId && datasource.getShapeById(shapeId); 
            if (shape) {
              showPopup(shape);
            }
          };

          const listItemClick = (id?: string) => {
            const shapeId = id && hotelIdToShapeIdMap.get(id);
            const shape = shapeId && datasource.getShapeById(shapeId);
            if (shape) {
                map.setCamera({
                    center: shape.getCoordinates(),
                    zoom: 15
                });
                shapeClick(shape);
            }
          };

          map.events.add('click', symbolLayer, mapClickHandler);
          map.events.add('mousemove', symbolLayer, highlightListItem);
          map.events.add('mouseout', symbolLayer, () => {
            map.getCanvasContainer().style.cursor = 'grab';
          });
          setMap(map);
          LimitScrollWheelZoom(map); // Remove if not needed
        });
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
  }, [Locations]);

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
        }, 2000);
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
      <div className="mainContainer">
        <div className="sidePanel">
          <div id="pageInfo"></div>
          <br />
          <div id="resultList">{resultList}</div>
        </div>
        <div className="mapContainer">
          <div id="myMap" ref={mapRef}></div>
          <div className="controlContainer">
            <button className="navButton" onClick={zoomMap(1)} title="Zoom In">+</button>
            <button className="navButton" onClick={zoomMap(-1)} title="Zoom Out">-</button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .mainContainer {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100vh;
        }
        .mapContainer {
          position: relative;
          flex-grow: 1;
          height: 50vh;
        }
        #myMap {
          width: 100%;
          height: 100%;
        }
        .controlContainer {
          position: absolute;
          bottom: 10px;
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
        .sidePanel {
          width: 100%;
          height: 50vh;
          padding: 10px;
          overflow-y: auto;
        }
        .property-row {
          border-bottom: 1px solid #ddd;
        }
        .property-row:last-child {
          border-bottom: none;
        }
        #resultList {
          height: calc(100% - 50px);
          overflow-y: auto;
        }

        @media (min-width: 768px) {
          .mainContainer {
            flex-direction: row;
          }
          .mapContainer {
            height: 100vh;
          }
          .sidePanel {
            width: 350px;
            height: 100vh;
          }
        }

        @media (min-width: 1024px) {
          .sidePanel {
            width: 400px;
          }
        }
      `}</style>
    </>
  );
};

export default MapPage;
