let joined_data, ac_data,ntsb_data
let crashData, usMap, mapData

let mapUrL =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

/**
 * Load data from CSV files asynchronously
 */

joined_data_p = d3.csv('data/joinTable.csv')
ac_data_p = d3.csv('data/airline_accidents_new.csv')
ntsb_data_p = d3.csv('data/ntsb_aviation_data_new.csv')

// default values for data filters
let secondary_selector = "Total Fatal Injuries"
let checkboxes = [true,true,false] // commercial, private, amateur
let date = [1970,2020]
let visualizations_view_2 = [] // every vis here that needs data to change in view 2
let full_data // unfiltered data copy

// setup dispatchers
const control_panel_dispatcher = d3.dispatch('control_filter')



// Render vis elements after data is all loaded
Promise.all([joined_data_p,ac_data_p,ntsb_data_p]).then((data) => {
    joined_data = data[0]
    full_data = Array.from(data[0])

    // Create Map
    d3.json(mapUrL).then((_mapData) => {
        mapData = _mapData;
        mapData = topojson.feature(mapData, mapData.objects.states).features;
        usMap = new USMap({parentElement: '#us-map'}, joined_data, mapData);
        usMap.updateVis();

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
        const overview = new Overview(joined_data,'#overview',control_panel_dispatcher,secondary_selector)
        visualizations_view_2.push(overview)
        const detail = new Detail(joined_data,'#detail',control_panel_dispatcher,secondary_selector)
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
            joined_data = controlBoxFilter(full_data,visualizations_view_2,checkboxes,secondary_selector,date,overview)
        })

        d3.selectAll('select.control-select').on('change', function () {
            secondary_selector = d3.select(this).property("value")
            joined_data = controlBoxFilter(full_data,visualizations_view_2,checkboxes,secondary_selector,date,overview)
        })

        control_panel_dispatcher.on('control_filter', function (event,context){
            date = this.date
            console.log(date)
            controlBoxFilter(full_data,visualizations_view_2,checkboxes,secondary_selector,date,overview)
        })
    })
});

function controlBoxFilter(data,views,checkboxes,secondary_select,date,overview){
    let new_Data = data

    // checkbox filtering
    if(checkboxes[0] === true && checkboxes[1] === false) {
        new_Data = new_Data.filter((ele) => {
            return ele['Purpose of Flight'] !== 'Personal'
        })
    }else if(checkboxes[0] === false && checkboxes[1] === true){
        new_Data = new_Data.filter((ele) => {
            return ele['Purpose of Flight'] === 'Personal'
        })
    }else if(checkboxes[0] === false && checkboxes[1] === false){
        // TODO select other button if both deselected, having both unselected doesn't make sense
        new_Data = new_Data
    }
    if(checkboxes[2] === false){ // don't include amateur built
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
    views.forEach((vis) => {vis.attribute = secondary_selector})


    // change data and update views
    views.forEach((vis)=> {
        vis.data = new_Data
        vis.updateVis()
    })
    console.log(new_Data)
    return new_Data
}

