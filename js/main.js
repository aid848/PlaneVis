let joined_data, ac_data, ntsb_data, map_data
let crashData, usMap, mapData

/**
 * Load data from CSV files asynchronously
 */

joined_data_p = d3.csv('data/joinTable.csv')
ac_data_p = d3.csv('data/airline_accidents_new.csv')
ntsb_data_p = d3.csv('data/ntsb_aviation_data_new.csv')
us_map_data_p = d3.json('data/us.json')


// default values for data filters
let primary_selector = "Make_ac"
let secondary_selector = "fatalities"
let checkboxes = [false, false, false]// TODO refactor to map // commercial, private, amateur
let date = [1970, 2020]
let visualizations_view_2 = [] // every vis here that needs data to change in view 2
let full_data // unfiltered data

// TODO setup dispatchers
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
    }, map_data, joined_data);

        // data formatting
        let timeParser = d3.timeParse("%Y-%m-%d")
        joined_data.forEach((ele) => {
            // console.log(ele['Event Date_ac'])
            ele['Event Date_ac'] = timeParser(ele['Event Date_ac'])
        })


        // vis element instantiation
        const control_panel = new Controls(joined_data, '#date_slider', control_panel_dispatcher)
        visualizations_view_2.push(control_panel)
        const overview = new Overview(joined_data, '#overview', control_panel_dispatcher, primary_selector)
        visualizations_view_2.push(overview)
        const detail = new Detail(joined_data, '#detail', control_panel_dispatcher, secondary_selector)
        visualizations_view_2.push(detail)


        d3.selectAll('input.controlbox').on('click', function () {
            switch (this.name) {  // TODO refactor to map and just change value in map
                // todo change commercial and private to toggle the other if both unselected
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
            joined_data = controlBoxFilter(full_data, visualizations_view_2, checkboxes, primary_selector, secondary_selector, date, overview)
        })

        d3.selectAll('select.control-select').on('change', function () {
            switch (this.id) {
                case 'primary-selector':
                    primary_selector = d3.select(this).property("value")
                    break;
                case 'secondary-selector':
                    secondary_selector = d3.select(this).property("value")
                    break;
            }
            joined_data = controlBoxFilter(full_data, visualizations_view_2, checkboxes, primary_selector, secondary_selector, date, overview)
        })

        control_panel_dispatcher.on('control_filter', function (event, context) {
            // console.log()
            date = this.date
            console.log(date)
            controlBoxFilter(full_data, visualizations_view_2, checkboxes, primary_selector, secondary_selector, date, overview)
        })
    }).catch(error => console.error(error));


function controlBoxFilter(data, views, checkboxes, primary_select, secondary_select, date, overview) {
    let new_Data = data

    // checkbox filtering
    if (checkboxes[0] === true && checkboxes[1] === false) {
        console.log('ahh')
        new_Data = new_Data.filter((ele) => {
            return ele['Purpose of Flight'] !== 'Personal'
        })
    } else if (checkboxes[0] === false && checkboxes[1] === true) {
        new_Data = new_Data.filter((ele) => {
            return ele['Purpose of Flight'] === 'Personal'
        })
    }
    if (checkboxes[2] === false) { // don't include amateur built
        new_Data = new_Data.filter((ele) => {
            return ele['Amateur Built'].toLowerCase() !== 'yes'
        })
    }

    // todo date filtering
    // new_Data = new_Data.filter((ele) => {
    //     // console.log(ele)
    //     // todo filter date
    //     // return () && ()
    // })

    // todo dropdown filtering


    // change data and update views
    views.forEach((vis) => {
        vis.data = new_Data
        vis.updateVis()
    })
    console.log(new_Data)
    return new_Data
}

