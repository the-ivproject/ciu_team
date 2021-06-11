// Google sheet name
const google_sheet_name = 'https://docs.google.com/spreadsheets/d/1tInlofdk4d0To94XA21n2cUPfuXbbe1Z'
// Sheet name
const sheet_name = 'team'

// Mapbox token
const mapbox_token = 'pk.eyJ1IjoiaXZwcm9qZWN0IiwiYSI6ImNrcDZuOWltYzJyeGMycW1jNDVlbDQwejQifQ.97Y2eucdbVp1F2Ow8EHgBQ'

//YOUR TURN: add your Mapbox token
mapboxgl.accessToken = mapbox_token

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
    center: [31.799643705686073, -39.700238700624276], // starting position [lng, lat]
    zoom: 3, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

$(document).ready(() => {
    $.ajax({
        type: "GET",
        //YOUR TURN: Replace with csv export link
        url: `${google_sheet_name}/gviz/tq?tqx=out:csv&sheet=${sheet_name}`,
        dataType: "text",
        success: function (csvData) {
            makeGeoJSON(csvData);
        }
    });

    let makeGeoJSON = csvData => {
        csv2geojson.csv2geojson(csvData, {
            latfield: 'latitude',
            lonfield: 'longitude',
            delimiter: ','
        }, (err, data) => {
            var geo = {
                'id': 'csvData',
                'type': 'circle',
                'source': {
                    'type': 'geojson',
                    'data': data
                },
            }

            geo.source.data.features.forEach(marker => {
                var el = document.createElement('img');
                el.className = 'icon-image';
                el.src = marker.properties.image_path

                // make a marker for each feature and add it to the map
                new mapboxgl.Marker(el)
                    .setLngLat(marker.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
                    .setHTML('<h3>' + marker.properties.name + '</h3><p>' + marker.properties.description + '</p>'))
                    .addTo(map)
            })

            let UseBbox = () => {
                let bbox = turf.bbox(data);
                map.fitBounds(bbox, {
                    padding: 50
                })
            }
            UseBbox()
        });
    };
});