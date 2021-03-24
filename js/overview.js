// Overview from primary selector, tooltip and click to highlight changes map view, ordered sort, physics?

class Overview{
    constructor(_data,_parent_element, _dispatcher, _grouping) {
        this.data = _data
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.width = 1080
        this.height = this.width/2
        this.maxCircleSize = 30
        this.minCircleSize = 5
        this.padding = 5
        this.groupBy = _grouping
        this.maxElements = 100
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

        vis.chart = vis.svg.append("g")
            .attr("transform",`translate(${vis.padding},${vis.padding})`)
            .attr('class', 'chart')
            .attr("width", vis.width-vis.padding*2)
            .attr("height", vis.height-vis.padding*2)


        // scales
        vis.xScale = d3.scaleLinear()
        vis.radiusScale = d3.scaleSqrt().range([vis.minCircleSize,vis.maxCircleSize])

        // TODO some kind of static size,color legend

        vis.updateVis()
    }
    updateVis(){
        const vis = this

        vis.dataGrouped = d3.groups(vis.data, (d) => d[vis.groupBy])
        vis.dataGrouped = vis.dataGrouped.sort(((a, b) => a[1].length - b[1].length)).reverse().slice(0,vis.maxElements)
        console.log(vis.dataGrouped)
        vis.radiusScale.domain([0,200]) // todo use min and max
        vis.renderVis()
    }
    renderVis(){
        // TODO color if applicable for secondary selector (eg avg severity of accidents for num of accidents)
        const vis = this

        vis.node = vis.chart
            .selectAll('g')
            .data(vis.dataGrouped, d => d)
            .join('g')
            .attr('class','node')
            .attr('transform', `translate(${vis.width/2},${vis.height/2})`)


        vis.circles = vis.node.append('circle')
            .attr('r', d => vis.radiusScale(d[0].length))
            .attr('fill','red')

        vis.node
            .append('text')
            .text("hi")

        // todo repel nodes more strongly
        // todo put bounding box
        vis.sim = d3.forceSimulation(vis.dataGrouped)
            .force("x", d3.forceX(vis.width/2).strength(0.01))
            .force("y", d3.forceY(vis.height/2).strength(0.02))
            .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5))
            .force('charge', d3.forceManyBody().strength(-10))
            .on("tick", function () {
                vis.node.enter()
                    .append('g')
                    .merge(vis.node)
                    .attr('transform', function (d){
                        return `translate(${d.x},${d.y})`
                    })
                    .call(d3.drag() // call specific function when circle is dragged
                    .on("start", d=> vis.dragStart(d,vis.sim))
                    .on("drag", vis.drag)
                    .on("end", d=> vis.dragEnd(d,vis.sim)));
                vis.node.exit().remove()
            })




    }

    dragStart(d,sim) {
        sim.alphaTarget(0.3).restart();
    }
    drag(d) {
        d.subject.x = d.x;
        d.subject.y = d.y;
    }
    dragEnd(d,sim) { // stop the bubbles from moving around after user is done
        sim.alphaTarget(0);
    }


}


