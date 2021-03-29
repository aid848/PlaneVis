let countyURL =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
let educationURL =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

let countyData;
let educationData;
let usMap;
let flightPhase;

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


//Load data from CSV file asynchronously and render chart
d3.csv('data/joinTable.csv').then(data => {
    // preprocess
    // let flight_phases = d3.group(data, d=>d["Flight Phase"]).keys(); // only want the phases
    // flight_phases = Array.from(flight_phases)
    // let general_phases = [];
    // flight_phases.forEach((phase) => {
    //     // only want the general phase so get the first word in phase
    //     if (!(general_phases.includes(phase.split(" ")[0]))) {
    //         general_phases.push(phase.split(" ")[0])
    //     }
    // });

    data.forEach(d => {
        d["Flight Phase General"] = d["Flight Phase"].split(" ")[0]
    });

    // group the data based on Phases
    const groupedData = d3.groups(data,
            d=>d["Flight Phase General"],
            d=>d["Purpose of Flight"] === "Personal",
        );

    flightPhase = new FlightPhase({ parentElement: '#flight-phase'}, groupedData);
    flightPhase.updateVis();
});