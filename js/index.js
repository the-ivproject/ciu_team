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
    style: 'mapbox://styles/mapbox/light-v10', // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
    // center: [19.50, -36.10], // starting position [lng, lat]
    zoom: 1, // starting zoom
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
            let source = {
                type: 'geojson',
                // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
                // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
                data: data,
                cluster: true,
                clusterMaxZoom: 14, // Max zoom to cluster points on
                clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
            }

            // Add a new source from our GeoJSON data and
            // set the 'cluster' option to true. GL-JS will
            // add the point_count property to your source data.
            map.addSource('geo', source);

            source.data.features.forEach((marker, i) => {
                var el = document.createElement('img');
                el.className = 'icon-image';
                el.src = marker.properties.image_path

                // make a marker for each feature and add it to the map
                new mapboxgl.Marker(el)
                    .setLngLat(marker.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup({
                            offset: 25
                        }) // add popups
                        .setHTML(`<img class="img_staff" src="${marker.properties.image_path}"><h4>${marker.properties.name}</h4><p>${marker.properties.description}</p>`))
                    .addTo(map).on('mouseenter',() => {
                        map.getCanvas().style.cursor = 'pointer';
                    });
            })
        }
            map.on('style.load', () => {
                // Triggered when `setStyle` is called.
                if (data) addDataLayer();
            });

            map.on('load', () => {

                addDataLayer()         

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'geo', () => {
                    map.getCanvas().style.cursor = '';
                });

                map.on('data', e => {
                    if (e.dataType === 'source' && e.sourceId === 'composite') {
                        document.getElementById("loader").style.visibility = "hidden";
                        document.getElementById("overlay").style.visibility = "hidden";
                    }
                })

                let UseBbox = () => {
                    let bbox = turf.bbox(data);
                    map.fitBounds(bbox, {
                        padding: 50
                    })
                }

                UseBbox()

            });
     
        });
    };
});