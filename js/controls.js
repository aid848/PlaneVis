class Controls{

    constructor(_data,_parent_element, _dispatcher) {
        this.data = _data // Data should only be changed based on filters besides date
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.width = 400
        this.padding = 5
        this.height = this.width/8

        this.initVis()
    }

    initVis(){
        // Create SVG area, initialize scales and axes
        const vis = this
        vis.svg = d3
            .select(vis.parent_element)
            .append("svg")
            .attr("width", vis.width+vis.padding)
            .attr("height", vis.height+vis.padding)

        // Append group element that will contain our actual chart
        // and position it according to the given padding config
        vis.chartArea = vis.svg.append("g")
            .attr("transform",`translate(${vis.padding},${vis.padding})`)
            .attr('id', 'date_slider_chart')
            .attr("width", vis.width)
            .attr("height", vis.height)
        vis.chart = vis.chartArea.append("g")

        // scales
        vis.xScale = d3.scaleLinear().range([vis.padding,vis.width-vis.padding])
        vis.yScale = d3.scaleLinear().range([vis.height-vis.padding,vis.padding])

        // axis
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d => d).tickSize(1)
        vis.yAxis = d3.axisLeft(vis.yScale)//.tickSize(-vis.width);

        // axis groups
        vis.xAxisGroup = vis.chartArea.append("g").attr("class", "axis x-axis")
        vis.yAxisGroup = vis.chartArea.append("g").attr("class", "axis y-axis")

        vis.brush = d3.brushX().on('end', function(){
            // todo put guard against null selection
            console.log(vis.xScale.invert(d3.brushSelection(this)[0]))
            console.log(vis.xScale.invert(d3.brushSelection(this)[1]))
            // todo round and move selector
            // todo on brush call dispatcher to re-filter data
        })
        this.updateVis()
    }
    updateVis(){
        const vis = this

        // TODO update data externally, don't change for date range selections!

        // get the data years for histogram density view
        vis.data_dates = d3.group(vis.data, d=> new Date(d['Event Date_ac']).getFullYear())
        let largest = 0
        let smallest = Infinity
        // console.log(vis.data_dates)
        vis.data_dates.forEach(ele => {
            if(ele.length > largest)
                largest = ele.length

            if(ele.length < smallest)
                smallest = ele.length
        })
        console.log([d3.min(vis.data_dates.keys()),d3.max(vis.data_dates.keys())])

        vis.xScale.domain([d3.min(vis.data_dates.keys()),d3.max(vis.data_dates.keys())])
        vis.yScale.domain([0,largest])
        // console.log(smallest)
        // console.log(largest)
        vis.renderVis()
    }
    renderVis(){
        const vis = this

        // todo add backgroup lines for brush
        vis.bars = vis.chartArea.selectAll('.bar')
            .data(vis.data_dates, d=> {
                return d
            })
            .join('rect')
            .attr('class', d => `bar-volume-${d[0]}`)
            .attr('x', d=> vis.xScale(d[0]))
            .attr('width', 5)
            .attr('height', d => {
                return vis.height + vis.padding - vis.yScale(d[1].length)
            })
            .attr('y', d => vis.padding + vis.yScale(d[1].length))






        // TODO fix extent to not include dates
        vis.chart.call(vis.brush)//.extent([[0,100],[100,400]]))
        vis.xAxisGroup.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisGroup.call(vis.yAxis).call((g) => g.select(".domain").remove());
    }
}

// TODO primary (Make, Injury severity,  ) drop down listener and cache

// TODO date range selector (d3 brush slider of relative volume of data

// TODO secondary (fatalities,avg aircraft damage, num accidents) dropdown listener and cache

// TODO radio buttons (commercial, private, amateur built) dispatcher call and cache of radio buttons
