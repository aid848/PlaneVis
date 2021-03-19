let joined_data, ac_data,ntsb_data

/**
 * Load data from CSV files asynchronously
 */

const joined_data_p = d3.csv('data/joinTable.csv')
const ac_data_p = d3.csv('data/airline_accidents_new.csv')
const ntsb_data_p = d3.csv('data/ntsb_aviation_data_new.csv')

// default values for data filters
let primary_selector = "make"
let secondary_selector = "fatalities"
let checkboxes = [false,false,false]// TODO refactor to map // commercial, private, amateur


// TODO setup dispatchers
const control_panel_dispatcher = d3.dispatch('control_filter')



// Render vis elements after data is all loaded
Promise.all([joined_data_p,ac_data_p,ntsb_data_p]).then((data) => {
    joined_data = data[0] // should we just use this for the main view?
    ac_data = data[1]
    ntsb_data = data[2]



    // data formatting
    let timeParser = d3.timeParse("%Y-%m-%d")
    joined_data.forEach((ele)=> {
        // console.log(ele['Event Date_ac'])
        ele['Event Date_ac'] = timeParser(ele['Event Date_ac'])
    })

    console.log(joined_data)
    // vis element instantiation
    const control_panel = new Controls(joined_data,'#date_slider',control_panel_dispatcher)

    d3.selectAll('input.controlbox').on('click',function(){
        console.log(this.name)
        console.log(this.checked)
        switch (this.name){  // TODO refactor to map and just change value in map
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
        console.log(checkboxes)
        // todo filtering here and update vis views
    })

    d3.selectAll('select.control-select').on('change', function (){
        console.log(d3.select(this).property("value"))
        // todo filtering here and update vis views
    })


})



