let joined_data, ac_data, ntsb_data, map_data
let crashData, usMap, mapData, flightPhase, stackedBarChart, currentFlightStop;
const dispatcher = d3.dispatch('filterPhaseData');

/**
 * Load data from CSV files asynchronously
 */

joined_data_p = d3.csv('data/joinTable.csv')
ac_data_p = d3.csv('data/airline_accidents_new.csv')
ntsb_data_p = d3.csv('data/ntsb_aviation_data_new.csv')
us_map_data_p = d3.json('data/us.json')


// default values for data filters
let secondary_selector = "Total Fatal Injuries"
let checkboxes = [true, true, false] // commercial, private, amateur
let date = [1970, 2020]

let visualizations_view_2 = [] // every vis here that needs data to change in view 2
let full_data // unfiltered data copy

// setup dispatchers
const control_panel_dispatcher = d3.dispatch('control_filter')

// Render vis elements after data is all loaded
Promise.all([
    joined_data_p,
    ac_data_p,
    ntsb_data_p,
    us_map_data_p]).then((data) => {

    joined_data = data[0] // should we just use this for the main view?
    full_data = Array.from(data[0])
    map_data = data[3]
    // ac_data = data[1]
    // ntsb_data = data[2]

    usMap = new UsMap({
        parentElement: '#map'
    }, map_data, joined_data, secondary_selector);

    // data formatting
    let timeParser = d3.timeParse("%Y-%m-%d")
    joined_data.forEach((ele) => {
        ele['Event Date_ac'] = timeParser(ele['Event Date_ac'])
        ele['Total Fatal Injuries'] = +ele['Total Fatal Injuries']
        ele['Total Fatal Injuries'] = +ele['Total Fatal Injuries']
        ele['Total Serious Injuries'] = +ele['Total Serious Injuries']
        ele['Total Minor Injuries'] = +ele['Total Minor Injuries']
        ele['Total Uninjured'] = +ele['Total Uninjured']
    })


    // vis element instantiation
    const control_panel = new Controls(joined_data, '#date_slider', control_panel_dispatcher)
    const overview = new Overview(joined_data, '#overview', control_panel_dispatcher, secondary_selector)

    visualizations_view_2.push(overview)
    // const detail = new Detail(joined_data, '#detail', control_panel_dispatcher, secondary_selector)
    const detail = new Detail(joined_data, '#detail', control_panel_dispatcher, secondary_selector)

    visualizations_view_2.push(detail)

    d3.selectAll('input.controlbox').on('click', function () {
        switch (this.name) {
            // todo change commercial and private to toggle both to on if both unselected (cosmetic)
            case 'commercial-box':
                checkboxes[0] = this.checked
                break;
            case 'private-box':
                checkboxes[1] = this.checked
                break;
            case 'amateur-box':
                checkboxes[2] = this.checked
                break;
            default:
        }
        joined_data = controlBoxFilter(full_data, visualizations_view_2, checkboxes, secondary_selector, date, overview)
    })

    d3.selectAll('select.control-select').on('change', function () {
        secondary_selector = d3.select(this).property("value")
        joined_data = controlBoxFilter(full_data, visualizations_view_2, checkboxes, secondary_selector, date, overview)
    })

    control_panel_dispatcher.on('control_filter', function (event, context) {
        date = this.date
        console.log(date)
        controlBoxFilter(full_data, visualizations_view_2, checkboxes, secondary_selector, date, overview)
    })
    joined_data.forEach(d => {
        d["Flight Phase General"] = d["Flight Phase"].split(" ")[0]
    });

    // group the data based on Phases

    const groupedData = d3.groups(joined_data,
        d => d["Flight Phase General"],
        d => d["Purpose of Flight"] === "Personal",
    );

    flightPhase = new FlightPhase({parentElement: '#flight-phase'}, groupedData, dispatcher);
    flightPhase.updateVis();

    // Create a waypoint for each `flight stop` circle
    const waypoints = d3.selectAll('.scroll-stop').each(function(d, stopIndex) {
        return new Waypoint({
            // `this` contains the current HTML element
            element: this,
            handler: function(direction) {
                // Check if the user is scrolling up or down
                const forward = direction === 'down';
                currentFlightStop = stopIndex;

                // Update visualization based on the current stop
                flightPhase.updateVis(forward, stopIndex);

            },
            // Trigger scroll event
            offset: '20%',
        });
    });

    stackedBarChart = new StackedBarChart({parentElement: '#chart'}, []);

}).catch(error => console.error(error));



// dispatcher to connect with stacked bar chart, to send phase name
dispatcher.on('filterPhaseData', phaseName => {
    // console.log("getting", phaseName)
    if (phaseName === "Summary") {
        stackedBarChart.data = joined_data;
    } else {
        stackedBarChart.data = joined_data.filter(d => {
            return d["Flight Phase General"].includes(phaseName)
        });
    }

    stackedBarChart.updateVis();
});

const marginFixed = Math.abs((window.outerHeight - 800)/2); // 800 is the containerHeight of Flight view
// when window is scrolling, detect where the flight phase view is and let it stay in view if reached
// let scrolled = false;
window.onscroll = function (e) {
    let startPosFlightContainer = d3.select('svg#flight-path').node().getBoundingClientRect().top;
    let diff = d3.select('#flight-phase').node().getBoundingClientRect().height;

    if (startPosFlightContainer < diff) {
        d3.select('#flight-phase').style('position', 'sticky').style('top', marginFixed+"px");
    }
};


function controlBoxFilter(data, views, checkboxes, secondary_select, date, overview) {
    let new_Data = data

    // Checkbox filtering
    if (checkboxes[0] === true && checkboxes[1] === false) {
        new_Data = new_Data.filter((ele) => {
            return ele['Purpose of Flight'] !== 'Personal'
        })
    } else if (checkboxes[0] === false && checkboxes[1] === true) {
        new_Data = new_Data.filter((ele) => {
            return ele['Purpose of Flight'] === 'Personal'
        })
    } else if (checkboxes[0] === false && checkboxes[1] === false) {
        // select other button if both deselected, having both unselected doesn't make sense
        new_Data = new_Data
    }
    if (checkboxes[2] === false) { // don't include amateur built
        new_Data = new_Data.filter((ele) => {
            return ele['Amateur Built'].toLowerCase() !== 'yes'
        })
    }

    // Date filtering
    new_Data = new_Data.filter((ele) => {
        let x = new Date(ele['Event Date_ac']).getFullYear()
        return (x >= date[0]) && (x <= date[1])
    })

    // dropdown filtering
    views.forEach((vis) => {
        vis.attribute = secondary_selector
    })

    // change data and update views
    views.forEach((vis) => {
        vis.data = new_Data
        vis.updateVis()
    })
    console.log(new_Data)
    return new_Data
}

