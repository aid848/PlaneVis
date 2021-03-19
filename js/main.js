let countyURL =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
let educationURL =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

let countyData;
let educationData;
let usMap;

// Create Map
d3.json(countyURL).then((data, error) => {
    if (error) {
        console.log(error);
    } else {
        countyData = data;
        countyData = topojson.feature(countyData, countyData.objects.counties)
            .features;
        console.log("County Data");
        console.log(countyData);

        d3.json(educationURL).then((data, error) => {
            if (error) {
                console.log(error);
            } else {
                educationData = data;
                console.log("Education Data");
                console.log(educationData);
                usMap = new USMap({ parentElement: '#us-map'}, data, educationData, countyData);
                usMap.updateVis();
            }
        });
    }
});