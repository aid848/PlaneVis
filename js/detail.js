// Overview from secondary selector, tooltip and click to highlight changes map view, ordered sort, glyph,  physics?

class Detail{
    constructor(_data,_parent_element, _dispatcher, _attr) {
        this.data = _data
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.width = 540
        this.height = this.width/2
        this.maxCircleSize = 20
        this.minCircleSize = 2
        this.padding = this.maxCircleSize/2
        this.attribute = _attr
        this.groupBy = "Make_ac"
        this.initVis()
    }
    initVis(){
        const vis = this

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.parent_element)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.chartArea = vis.svg.append("g")
            .attr("transform",`translate(${vis.padding},${vis.padding})`)
            .attr('id', 'detail_chart')


        // TODO scales

        // TODO some kind of static size legend

        vis.updateVis()
    }
    updateVis(){
        const vis = this

        vis.dataGrouped = d3.groups(vis.data, (d) => d[vis.groupBy])

        vis.renderVis()
    }
    renderVis(){
        const vis = this

    }
}
