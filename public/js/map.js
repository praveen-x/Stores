mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdjEyMyIsImEiOiJja3RkNDZ1d2IwMWlwMm9xcTVoYWk1ODY3In0.OYl7eoft3W8WNK8EssfjlA';
navigator.geolocation.getCurrentPosition(successLocation, errorLocation, { enableHighAccuracy: true})
let start = [74.7999999, 34.0720111];

function successLocation(position) {
    console.log(position)
    setupMap([position.coords.longitude, position.coords.latitude])
    currentLat = position.coords.latitude;
    currentLon = position.coords.longitude;
    
}
function errorLocation() {
    setupMap([74.7999999, 34.0720111])
}
// define map
function setupMap(center){
    map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://style/mapbox/streets-v11',
    zoom: 11,
    center: center   
});

//Create a new marker.
const marker = new mapboxgl.Marker()
    .setLngLat(center)
    .addTo(map);

map.addControl(
  new mapboxgl.GeolocateControl({
      positionOptions: {
          enableHighAccuracy: true
      },
      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
  
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
      showUserHeading: true
  }), 
);

  const nav = new mapboxgl.NavigationControl()
  map.addControl(nav)
// create a function to make a directions request
  async function getRoute(end) {
    // make a directions request using cycling profile
    // an arbitrary start will always be the same
    // only the end or destination will change
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
    const json = await query.json();
    const data = json.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route
      }
    };
    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: geojson
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    }
    // add turn instructions here at the end
  }
  
  map.on('load', () => {
    // make an initial directions request that
    // starts and ends at the same location
    getRoute(start);
  
    // Add starting point to the map
    map.addLayer({
      id: 'point',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: start
              }
            }
          ]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#3887be'
      }
    });
    // this is where the code from the next step will go
    map.on('click', ({ lngLat }) => {
      const coords = Object.keys(lngLat).map((key) => lngLat[key]);
      const end = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: coords
            }
          }
        ]
      };
      if (map.getLayer('end')) {
        map.getSource('end').setData(end);
      } else {
        map.addLayer({
          id: 'end',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: coords
                  }
                }
              ]
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#f30'
          }
        });
      }
      getRoute(coords);
    });
    
  });
} 
// Fetch stores from API
async function getStores() {
    const res = await fetch('/api/v1/stores');
    const data = await res.json();
  
    const stores = data.data.map(store => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            store.location.coordinates[0],
            store.location.coordinates[1]
          ]
        },
        properties: {
          //storeId: store.storeId,   // will show store id on map.
          storeName: store.storeName,
          discount: store.discount,
          icon: 'shop'
        }
      };
    });
  
    loadMap(stores);
}

// Fetch stores from API
async function getStoresFromData(formData) {

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify(formData);

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    const res = await fetch("/api/v1/submit-data/", requestOptions);
    const data = await res.json();


    const stores = data.data.map(store => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            store.location.coordinates[0],
            store.location.coordinates[1]
          ]
        },
        properties: {
          //storeId: store.storeId,   // will show store id on map.
          storeName: store.storeName,
          discount: store.discount,
          icon: 'shop'
        }
      };
    });
    
    
    if (map.getLayer('points')) {
      map.removeLayer('points');
    }
    if (map.getSource('points')) {
      map.removeSource('points');
    }


    loadMap(stores);
}
  
// Load map with stores
function loadMap(stores) {

        map.addLayer({
          id: 'points',
          type: 'symbol',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: stores
            }
          },
          layout: {
            'icon-image': '{icon}-15',
            'icon-size': 1.5,
            'text-field': '{storeName}, {discount} off',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0.9],
            'text-anchor': 'top'
          }
        });

}
  
getStores();















// ====================================================
// Manual Location passed
// ====================================================













/*

mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdjEyMyIsImEiOiJja3RkNDZ1d2IwMWlwMm9xcTVoYWk1ODY3In0.OYl7eoft3W8WNK8EssfjlA';
navigator.geolocation.getCurrentPosition(successLocation, errorLocation, { enableHighAccuracy: true})

// ask for current location
let center = [74.7999999, 34.0720111];
let start = [74.7999999, 34.0720111];
function successLocation(position) {
    console.log(position)
    //setupMap([position.coords.longitude, position.coords.latitude])
    
}
function errorLocation() {
    //setupMap([74.7999999, 34.0720111])
}
// define map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://style/mapbox/streets-v11',
    zoom: 11,
    center: center   
});

//Create a new marker.
const marker = new mapboxgl.Marker()
    .setLngLat(center)
    .addTo(map);
// create a function to make a directions request
async function getRoute(end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  const json = await query.json();
  const data = json.routes[0];
  const route = data.geometry.coordinates;
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };
  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(geojson);
  }
  // otherwise, we'll make a new request
  else {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
  }
  // add turn instructions here at the end
}

map.on('load', () => {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(start);

  // Add starting point to the map
  map.addLayer({
    id: 'point',
    type: 'circle',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: start
            }
          }
        ]
      }
    },
    paint: {
      'circle-radius': 10,
      'circle-color': '#3887be'
    }
  });
  // this is where the code from the next step will go
  map.on('click', ({ lngLat }) => {
    const coords = Object.keys(lngLat).map((key) => lngLat[key]);
    const end = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: coords
          }
        }
      ]
    };
    if (map.getLayer('end')) {
      map.getSource('end').setData(end);
    } else {
      map.addLayer({
        id: 'end',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: coords
                }
              }
            ]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#f30'
        }
      });
    }
    getRoute(coords);
  });
  
});

// Fetch stores from API
async function getStores() {
    const res = await fetch('/api/v1/stores');
    const data = await res.json();
  
    const stores = data.data.map(store => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            store.location.coordinates[0],
            store.location.coordinates[1]
          ]
        },
        properties: {
          //storeId: store.storeId,   // will show store id on map.
          storeName: store.storeName,
          discount: store.discount,
          icon: 'shop'
        }
      };
    });
  
    loadMap(stores);
}

// Fetch stores from API
async function getStoresFromData(formData) {

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify(formData);

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    const res = await fetch("/api/v1/submit-data/", requestOptions);
    const data = await res.json();


    const stores = data.data.map(store => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            store.location.coordinates[0],
            store.location.coordinates[1]
          ]
        },
        properties: {
          //storeId: store.storeId,   // will show store id on map.
          storeName: store.storeName,
          discount: store.discount,
          icon: 'shop'
        }
      };
    });
    
    
    if (map.getLayer('points')) {
      map.removeLayer('points');
    }
    if (map.getSource('points')) {
      map.removeSource('points');
    }


    loadMap(stores);
}
  
// Load map with stores
function loadMap(stores) {

        map.addLayer({
          id: 'points',
          type: 'symbol',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: stores
            }
          },
          layout: {
            'icon-image': '{icon}-15',
            'icon-size': 1.5,
            'text-field': '{storeName}, {discount} off',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0.9],
            'text-anchor': 'top'
          }
        });

}
  
getStores();

*/


