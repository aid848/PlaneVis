let mapUrL =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

let mapData;
let crashData;
let usMap;

//Parse crash data (joined table csv)
d3.csv('data/joinTable.csv').then((_crashData) => {
    crashData = _crashData;
    console.log("crash data");
    console.log(crashData);

    // Create Map
    d3.json(mapUrL).then((_mapData) => {
            mapData = _mapData;
            mapData = topojson.feature(mapData, mapData.objects.states)
                .features;
            console.log("Map Data");
            console.log(mapData);
            usMap = new USMap({ parentElement: '#us-map'}, crashData, mapData);
            usMap.updateVis();
    }).catch(error => console.error(error));

}).catch(error => console.error(error));

