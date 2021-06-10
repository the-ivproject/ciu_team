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
    center: [112.632, -7.966], // starting position [lng, lat]
    zoom: 13, // starting zoom
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
            let addDataLayer = () => {
                var geo = {
                    'id': 'csvData',
                    'type': 'circle',
                    'source': {
                        'type': 'geojson',
                        'data': data
                    },
                }
                geo.source.data.features.forEach(marker => {
                    // console.log(marker)
                    // create a HTML element for each feature
                    var el = document.createElement('img');
                    el.className = 'icon-image';
                    el.src = marker.properties.image_link
                    
                    el.addEventListener('click', function () {
                        let coor = marker.geometry.coordinates
                        let info = `<h6>tes`
                        new mapboxgl.Popup()
                        .setLngLat(coor)
                        .setHTML(info)
                        .addTo(map);
                    });

                    // make a marker for each feature and add it to the map
                    new mapboxgl.Marker(el)
                        .setLngLat(marker.geometry.coordinates)
                        .addTo(map);
                })
            }

            map.on('style.load', () => {
                // Triggered when `setStyle` is called.
                if (data) addDataLayer();
            });

            map.on('load', () => {

                addDataLayer()

                map.on('data', e => {
                    if (e.dataType === 'source' && e.sourceId === 'composite') {
                        document.getElementById("loader").style.visibility = "hidden";
                        document.getElementById("overlay").style.visibility = "hidden";
                    }
                })

                let UseBbox = () => {
                    let bbox = turf.bbox(data);
                    map.fitBounds(bbox, {
                        padding: 200
                    })
                }

                UseBbox()

                // Change the cursor to a pointer when the mouse is over the places layer.
                map.on('mouseenter', 'csvData', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'places', () => {
                    map.getCanvas().style.cursor = '';
                });
            });
        });
    };
});