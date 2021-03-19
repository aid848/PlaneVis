class Controls{

    constructor(_data,_parent_element, _dispatcher) {
        this.data = _data // Data should only be changed based on filters besides date
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.width = 100
        this.height = this.width/4
        this.padding = 5
        this.initVis()
    }

    initVis(){
        // Create SVG area, initialize scales and axes
        const vis = this
        vis.svg = d3
            .select(vis.parent_element)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)

        // Append group element that will contain our actual chart
        // and position it according to the given padding config
        vis.chartArea = vis.svg.append("g")
            .attr("transform",`translate(${vis.padding},${vis.padding})`)
        vis.chart = vis.chartArea.append("g")

        // scales
        vis.xScale = d3.scaleTime().range([0,vis.width-vis.padding])
        vis.yScale = d3.scaleLinear().range([0,vis.height-vis.padding])

        // axis
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d3.timeFormat("%Y"))
        vis.yAxis = d3.axisLeft(vis.yScale).tickSize(-vis.width);

        // axis groups
        vis.xAxisGroup = vis.chartArea.append("g").attr("class", "axis x-axis")
        vis.yAxisGroup = vis.chartArea.append("g").attr("class", "axis y-axis")

        vis.brush = d3.brushX().extent([[0,0], [vis.width, vis.height]])

        vis.brushGroup = g.append("g").attr("class", "brush")


        this.updateVis()
    }
    updateVis(){
        const vis = this

        // TODO update data externally, don't change for date range selections!

        // vis.xScale.domain(d3.extent(vis.data["Event Date_ac"]))
        vis.xScale.domain([1973,2007])
        vis.yScale.domain([0,1])
        vis.renderVis()
    }
    renderVis(){
        const vis = this

        // todo add backgroup lines for brush
        // vis.chartArea.selectAll('line')
        //     .data(vis.data)


        // todo on brush call dispatcher to re-filter data



        vis.brush.call()
        vis.xAxisGroup.call(vis.xAxis)
        vis.yAxisGroup.call(vis.yAxis)
    }
}

// TODO primary (Make, Injury severity,  ) drop down listener and cache

// TODO date range selector (d3 brush slider of relative volume of data

// TODO secondary (fatalities,avg aircraft damage, num accidents) dropdown listener and cache

// TODO radio buttons (commercial, private, amateur built) dispatcher call and cache of radio buttons