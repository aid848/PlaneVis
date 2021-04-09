// Overview from primary selector, tooltip and click to highlight changes map view, ordered sort, physics?

class Overview {
    constructor(_data, _parent_element, _dispatcher, _attr) {
        this.data = _data
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.width = 1080
        this.height = this.width / 2
        this.maxCircleSize = 100
        this.minCircleSize = 30
        this.padding = 5
        this.groupBy = "Make_ac"
        this.attribute = _attr
        this.maxElements = 50
        this.initVis()
    }

    initVis() {
        const vis = this

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.parent_element)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.chart = vis.svg.append("g")
            .attr("transform", `translate(${vis.padding},${vis.padding})`)
            .attr('class', 'chart')
            .attr("width", vis.width - vis.padding * 2)
            .attr("height", vis.height - vis.padding * 2)


        // scales
        vis.xScale = d3.scaleLinear()
        vis.radiusScale = d3.scaleSqrt().range([vis.minCircleSize, vis.maxCircleSize])

        // TODO some kind of static size chart,color legend (polish)

        vis.updateVis()
    }

    updateVis() {
        const vis = this
        vis.dataAttributed = vis.data.slice(0, vis.maxElements)
        vis.radiusScale.domain([vis.dataAttributed[vis.maxElements - 1][1], vis.dataAttributed[0][1]])
        vis.renderVis()
    }

    renderVis() {

        const vis = this

        vis.node = vis.chart
            .selectAll('g')
            .data(vis.dataAttributed, function (d){
                // console.log(d)
                return [d[0],vis.radiusScale(d[1])]
            })
            .join('g')
            .attr('class', 'node')
            .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`)
            .on('click', function () {
                const name = this.querySelector('text').innerHTML
                vis.dispatcher.call('overview_click', {name: name})
            })
            .on('mouseover', function (event,d) {
                // TODO tooltip info, padding?
                // TODO fix flicker by checking if bubbles are still in sim mode (only show when movement has stopped)
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style("left", event.pageX + 0 + "px")
                    .style("top", event.pageY + 0 + "px")
                    .html(
                        `<div class="tooltip-window">  <p>hi</p> </div>`
                    );
                // TODO do classed hover (cosmetic)

            }).on('mouseleave', function (event,d) {
                d3.select('#tooltip')
                    .style('display', 'none')
            })


        // vis.circles = vis.chart.merge(vis.node.enter())
        //     .selectAll('circle');

        vis.circles = vis.node
            .append('circle')
            .attr('r', d => vis.radiusScale(d[1]))
            .attr('fill', d => {
                // TODO color if applicable for secondary selector (eg avg severity of accidents for num of accidents) (cosmetic)
                return 'red'
            })



        vis.node
            .append('text')
            .attr("text-anchor", "middle")
            .style("font-size", function (d) {
                let r = d3.select(this.parentNode.querySelector('circle')).attr('r')
                let len = d[0].length
                return Math.min(r / 3, r * 2 / len) + "px";
            }) // TODO come up with better formula? (cosmetic)
            .text(d => {
                return d[0]
            })

        vis.sim = d3.forceSimulation(vis.dataAttributed, function (d){
            return [d[0],vis.radiusScale(d[1])]
        })
            .force("x", d3.forceX(vis.width / 2).strength(0.01))
            .force("y", d3.forceY(vis.height / 2).strength(0.01))
            .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5).strength(0.2))
            .force('charge', d3.forceManyBody().strength(-5))
            .force('collide', d3.forceCollide(function (d) {
                return vis.radiusScale(d[1])
            }).iterations(2).strength(1.0))
            .on("tick", function () {


                vis.node.enter()
                    .append('g')
                    .merge(vis.node)
                    .attr('transform', function (d) {
                        let x = d.x
                        let y = d.y
                        let rad = vis.radiusScale(d[1])

                        //bounding box logic
                        if (x > vis.width - vis.padding - rad) {
                            x = vis.width - vis.padding - rad
                        } else if (x - vis.padding - rad < 0) {
                            x = vis.padding + rad
                        }
                        if (y > vis.height - vis.padding - rad) {
                            y = vis.height - vis.padding - rad
                        } else if (y - vis.padding - rad < 0) {
                            y = vis.padding + rad
                        }
                        return `translate(${x},${y})`
                    })
                    .call(d3.drag() // call specific function when circle is dragged
                        .on("start", d => vis.dragStart(d, vis.sim))
                        .on("drag", vis.drag)
                        .on("end", d => vis.dragEnd(d, vis.sim)));

                vis.node.exit().remove()
                // vis.circles.exit().remove()

                d3.selectAll(vis.circles).exit().remove()
            })
    }

    dragStart(d, sim) {
        sim.alphaTarget(0.3).restart();
    }

    drag(d) {
        d3.select('#tooltip')
            .style('display', 'none')
        d.subject.x = d.x;
        d.subject.y = d.y;
    }

    dragEnd(d, sim) { // stop the bubbles from moving around after user is done
        sim.alphaTarget(0);
    }


}


