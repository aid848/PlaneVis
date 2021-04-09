let joined_data, ac_data, ntsb_data, map_data
let crashData, usMap, mapData, flightPhase, stackedBarChart

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
let view = 1

let visualizations_view_2 = [] // every vis here that needs data to change in view 2
let full_data // unfiltered data copy

// setup dispatchers
const control_panel_dispatcher = d3.dispatch('control_filter', 'overview_click')

// Render vis elements after data is all loaded
Promise.all([
    joined_data_p,
    ac_data_p,
    ntsb_data_p,
    us_map_data_p]).then((data) => {

    joined_data = data[0]
    map_data = data[3]

    usMap = new UsMap({
        parentElement: '#map'
    }, map_data, joined_data, secondary_selector);

    // data formatting
    let timeParser = d3.timeParse("%Y-%m-%d")
    joined_data.forEach((ele) => {
        ele["ID"] = +ele[""]
        ele['Event Date_ac'] = timeParser(ele['Event Date_ac'])
        ele['Total Fatal Injuries'] = +ele['Total Fatal Injuries']
        ele['Total Fatal Injuries'] = +ele['Total Fatal Injuries']
        ele['Total Serious Injuries'] = +ele['Total Serious Injuries']
        ele['Total Minor Injuries'] = +ele['Total Minor Injuries']
        ele['Total Uninjured'] = +ele['Total Uninjured']
    })

    full_data = Array.from(joined_data)
    // console.log(full_data[0])

    // vis element instantiation
    const control_panel = new Controls(joined_data, '#date_slider', control_panel_dispatcher)
    const overview = new Overview(overviewFilter(joined_data,secondary_selector), '#overview', control_panel_dispatcher, secondary_selector)

    visualizations_view_2.push(overview)
    // const detail = new Detail(joined_data, '#detail', control_panel_dispatcher, secondary_selector)
    visualizations_view_2.push(usMap)

    const detail = new Detail(detailFilter(joined_data, secondary_selector, null), '#detail', control_panel_dispatcher, secondary_selector, )
    visualizations_view_2.push(detail);


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
        joined_data = controlBoxFilter(full_data, visualizations_view_2, checkboxes, secondary_selector, date, overview, detail)
    })

    d3.selectAll('select.control-select').on('change', function () {
        secondary_selector = d3.select(this).property("value")
        joined_data = controlBoxFilter(full_data, visualizations_view_2, checkboxes, secondary_selector, date, overview, detail)
    })

    control_panel_dispatcher.on('control_filter', function (event, context) {
        // check if selection has actually changed
        if(date[0] === this.date[0] && date[1] === this.date[1]){
            return
        }
        date = this.date
        controlBoxFilter(full_data, visualizations_view_2, checkboxes, secondary_selector, date, overview, detail)
    })

    control_panel_dispatcher.on('overview_click', function (event,context){
        detail.data = detailFilter(full_data, secondary_selector, this.name);
        usMap.data = mapFilterOverview(full_data, secondary_selector, this.name);
        detail.updateVis()
        usMap.updateVis()
    })

    joined_data.forEach(d => {
        d["Flight Phase General"] = d["Flight Phase"].split(" ")[0]
    });

    // group the data based on Phases
    const phaseGroupedData = d3.groups(joined_data,
        d => d["Flight Phase General"],
        d => d["Purpose of Flight"] === "Personal",
    );

    flightPhase = new FlightPhase({parentElement: '#flight-phase'}, phaseGroupedData);
    flightPhase.updateVis();

    stackedBarChart = new StackedBarChart({parentElement: '#chart'}, joined_data);

}).catch(error => console.error(error));

function controlBoxFilter(data, views, checkboxes, secondary_select, date, overview, detail) {
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

    // dropdown filtering by group
    let overviewData = overviewFilter(new_Data,secondary_selector)
    let detailData = detailFilter(new_Data, secondary_selector, null)

    overview.attribute = secondary_selector;
    overview.data = overviewData;

    detail.attribute = secondary_selector;
    detail.data = detailData;

    usMap.attribute = decodeMapAttribute(secondary_selector);
    usMap.data = full_data;
    // change data and update views
    views.forEach((vis) => {
        vis.updateVis()
    })
    // console.log(new_Data)
    return new_Data
}

function mapFilterOverview (data, attribute, make) {
    let new_Data = data

    if(make !== null) {
        new_Data = new_Data.filter((ele) => {
            return ele['Make_ac'] === make;
        })
    }
    return new_Data;
}
function detailFilter(data, attribute, make) {
    let new_Data = data

    if(make !== null) {
        new_Data = new_Data.filter((ele) => {
            return ele['Make_ac'] === make;
        })
    }
    let dataGrouped = d3.groups(new_Data, (d) => d["Model_ac"])
    return groupFilter(dataGrouped, attribute);
}

function overviewFilter(data, attribute){
    let dataGrouped = d3.groups(data, (d) => d["Make_ac"])
    return groupFilter(dataGrouped, attribute);
}
function groupFilter(data,attribute){
    let dataAttributed = [];
    let dataGrouped = data;
    switch (attribute) {
        case 'Total Fatal Injuries':
            dataAttributed = dataGrouped.map(ele => {
                return [ele[0], ele[1].map(val => val[attribute]).reduce((acc, cur) => acc + cur)]
            })
            break;
        case 'Most Destroyed craft':
            dataAttributed = dataGrouped.map(ele => {
                return [ele[0], ele[1].map(val => val['Aircraft Damage']).filter((cur) => cur.toLowerCase() === 'destroyed').length]
            })
            break;
        case 'num-accidents':
            dataAttributed = dataGrouped.map(ele => [ele[0], ele[1].length])
            break;
        case 'Fatal to non-Fatal ratio':
            dataAttributed = dataGrouped.map(ele => {
                return [ele[0],
                    ele[1].map(e => e['Total Fatal Injuries']).reduce((acc, cur) => acc + cur) / (ele[1].map(e => e['Total Serious Injuries']).reduce((acc, cur) => acc + cur) + ele[1].map(e => e['Total Minor Injuries']).reduce((acc, cur) => acc + cur))]
            })
            dataAttributed = dataAttributed.filter((e) => e[1] !== Infinity && !isNaN(e[1]))
            break;
        case 'Serious Injuries':
            dataAttributed = dataGrouped.map(ele => {
                return [ele[0], ele[1].map(val => val['Total Serious Injuries']).reduce((acc, cur) => acc + cur)]
            })
            break;
        case 'Minor Injuries':
            dataAttributed = dataGrouped.map(ele => {
                return [ele[0], ele[1].map(val => val['Total Minor Injuries']).reduce((acc, cur) => acc + cur)]
            })
            break;
        case 'Injuries to Uninjured ratio':
            dataAttributed = dataGrouped.map(ele => {
                return [ele[0],
                    (ele[1].map(e => e['Total Fatal Injuries']).reduce((acc, cur) => acc + cur) + ele[1].map(e => e['Total Serious Injuries']).reduce((acc, cur) => acc + cur) + ele[1].map(e => e['Total Minor Injuries']).reduce((acc, cur) => acc + cur)) / ele[1].map(e => e['Total Uninjured']).reduce((acc, cur) => acc + cur)]
            })
            dataAttributed = dataAttributed.filter((e) => e[1] !== Infinity && !isNaN(e[1]))
            break;
    }
    // use secondary selector to order by magnitude
    dataAttributed = dataAttributed.sort(((a, b) => a[1] - b[1])).reverse()
    return dataAttributed
}

function decodeMapAttribute(attribute) {
    switch (attribute) {
        case 'Total Fatal Injuries':
            return 'Total Fatal Injuries';
            break;
        case 'Most Destroyed craft':
            return 'Damage';
            break;
        case 'num-accidents':
            return 'Total Fatal Injuries';
            break;
        case 'Fatal to non-Fatal ratio':
            return 'Total Fatal Injuries';
            break;
        case 'Serious Injuries':
            return 'Total Serious Injuries';
            break;
        case 'Minor Injuries':
            return 'Total Minor Injuries';

            break;
        case 'Injuries to Uninjured ratio':
            return 'Total Fatal Injuries';
            break;
    }
    return "Total Fatal Injuries";
}

function changeView(){
    if(view === 1){
        document.querySelector('#view1').style.display = 'none'
        document.querySelector('#view2').style.display = 'block'
        view = 2
    }else{
        document.querySelector('#view1').style.display = 'block'
        document.querySelector('#view2').style.display = 'none'
        view = 1
    }

}

function planeClass(element){

}
