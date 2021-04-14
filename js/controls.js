class Controls {

    constructor(_data, _parent_element, _dispatcher) {
        this.data = _data // Data should only be changed based on filters besides date
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.width = window.innerWidth * 0.3
        this.height = window.innerHeight * 0.2
        // this.width = 400
        this.padding = 10
        // this.height = this.width / 8

        this.initVis()
    }

    initVis() {
        // Create SVG area, initialize scales and axes
        const vis = this
        vis.svg = d3
            .select(vis.parent_element)
            .append("svg")
            .attr("width", vis.width + vis.padding)
            .attr("height", vis.height + vis.padding)

        // Append group element that will contain our actual chart
        // and position it according to the given padding config
        vis.chartArea = vis.svg.append("g")
            .attr("transform", `translate(${vis.padding},${vis.padding})`)
            .attr('id', 'date_slider_chart')
            .attr("width", vis.width)
            .attr("height", vis.height)
        vis.chart = vis.chartArea.append("g")

        // scales
        vis.xScale = d3.scaleLinear().range([vis.padding, vis.width - vis.padding])
        vis.yScale = d3.scaleLinear().range([vis.height - vis.padding, vis.padding])

        // axis
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d => d).tickSize(1).ticks()
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(3)

        // axis groups
        vis.xAxisGroup = vis.chartArea.append("g").attr("class", "axis x-axis")
        vis.yAxisGroup = vis.chartArea.append("g").attr("class", "axis y-axis")

        vis.brush = d3.brushX().on('end', function () {
            // Guard against null selection
            let dates
            if (d3.brushSelection(this) === null) {
                dates = vis.xScale.domain()
            } else {
                let low = Math.round(vis.xScale.invert(d3.brushSelection(this)[0]))
                let high = Math.round(vis.xScale.invert(d3.brushSelection(this)[1]))
                dates = [low, high]
            }
            // Todo round and move selector (cosmetic)

            // call dispatcher to re-filter data
            control_panel_dispatcher.call('control_filter', {date: dates})
        })

        vis.data_dates = d3.groups(vis.data, d => new Date(d['Event Date_ac']).getFullYear())
        vis.data_dates = controlFilter(vis.data,secondary_selector)
        vis.xScale.domain([d3.min(vis.data_dates, d => d[0]),d3.max(vis.data_dates, d => d[0]) ])
        this.updateVis()
    }

    updateVis() {
        const vis = this
        // get the data years for histogram density view
        let largest = 0
        let smallest = Infinity
        vis.data_dates.forEach(ele => {
            if (ele[1] > largest)
                largest = ele[1]

            if (ele[1] < smallest)
                smallest = ele[1]
        })
        vis.yScale.domain([smallest, largest])


        vis.renderVis()
    }

    renderVis() {
        const vis = this

        vis.bars = vis.chartArea.selectAll('rect')
            .data(vis.data_dates, d=>d[0])
            .join('rect')
            .attr('x', d => vis.xScale(d[0]))
            .attr('width', 5)
            .attr('height', d => {
                return vis.height + vis.padding - vis.yScale(d[1])
            })
            .attr('y', d => vis.padding + vis.yScale(d[1]))

        vis.bars.exit().remove()
        vis.chart.call(vis.brush)
        vis.xAxisGroup.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisGroup.call(vis.yAxis).call((g) => g.select(".domain").remove());
    }
}
