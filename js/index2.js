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
            map.on('load', function () {
                // // Add a new source from our GeoJSON data and set the
                // // 'cluster' option to true.
                // map.addSource("ciu_team", {
                //     type: "geojson",
                //     // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
                //     // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
                //     data: data,
                //     cluster: true,
                //     clusterMaxZoom: 14, // Max zoom to cluster points on
                //     clusterRadius: 40 // Radius of each cluster when clustering points (defaults to 50)
                // });
                let geo = {
                    'id': 'csvData',
                    'type': 'symbol',
                    'source': {
                        'type': 'geojson',
                        'data': data,
                        'cluster': true,
                        'clusterMaxZoom': 14, // Max zoom to cluster points on
                        'clusterRadius': 40, // Radius of each cluster when clustering points (defaults to 50)    
                    }
                }
                // Use the earthquakes source to create five layers:
                // One for unclustered points, three for each cluster category,
                // and one for cluster labels.

                map.addLayer(geo);

                var layers = [
                    [20, '#f28cb1'],
                    [10, '#f1f075'],
                    [0, '#51bbd6']
                ];

                layers.forEach(function (layer, i) {
                    map.addLayer({
                        "id": "cluster-" + i,
                        "type": "circle",
                        "source": "csvData",
                        "paint": {
                            "circle-color": layer[1],
                            "circle-radius": 18
                        },
                        "filter": i === 0 ?
                            [">=", "point_count", layer[0]] :
                            ["all",
                                [">=", "point_count", layer[0]],
                                ["<", "point_count", layers[i - 1][0]]]
                    });
                });

                data.features.forEach((e, i) => {
                    // Load an image from an external URL.
                    map.loadImage(
                        e.properties.image_path,
                        (error, image) => {
                            if (error) throw error;

                            // Add the image to the map style.
                            map.addImage('photo-' +i, image);

                            let s = {
                                id: 'unclustered-point-' + i,
                                type: 'symbol',
                                source: 'csvData',
                                filter: ['!', ['has', 'point_count']],
                                layout: {
                                    'icon-image': 'photo-' +i,
                                    'icon-size': 0.15
                                }
                            }

                            map.addLayer(s);
                        }
                    )

                        });


                    // Add a layer for the clusters' count labels
                    map.addLayer({
                        "id": "cluster-count",
                        "type": "symbol",
                        "source": "csvData",
                        "layout": {
                            "text-field": "{point_count}",
                            "text-font": [
                                "DIN Offc Pro Medium",
                                "Arial Unicode MS Bold"
                            ],
                            "text-size": 12
                        }
                    });
                });
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