// Overview from primary selector, tooltip and click to highlight changes map view, ordered sort, physics?

class Detail {
    constructor(_data, _parent_element, _dispatcher, _attr) {
        this.data = _data
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        // this.width = 300
        // this.height = this.width
        this.width = window.innerWidth * 0.3
        this.height = window.innerHeight * 0.5

        this.maxCircleSize = 50
        this.minCircleSize = 10
        this.padding = 5
        // this.groupBy = _grouping
        this.groupBy = "Model_ac"
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

        // TODO some kind of static size,color legend (m3)
        // console.log(vis.data)

        vis.updateVis()
    }

    updateVis() {
        const vis = this

        // vis.dataGrouped = d3.groups(vis.data, (d) => d[vis.groupBy])
        // vis.dataGrouped = vis.dataGrouped.sort(((a, b) => a[1].length - b[1].length)).reverse().slice(0, vis.maxElements)
        if(vis.data.length < 25 ){
            vis.maxElements = vis.data.length;
        } else {
            vis.maxElements = 25;
        }
        vis.dataGrouped = vis.data.slice(0, vis.maxElements)
        // console.log(vis.dataGrouped)
        vis.radiusScale.domain([vis.dataGrouped[vis.maxElements - 1][1], vis.dataGrouped[0][1]]) // todo use min and max
        vis.renderVis()
    }

    renderVis() {
        // TODO color if applicable for secondary selector (eg avg severity of accidents for num of accidents) (M3)
        const vis = this

        vis.node = vis.chart
            .selectAll('g')
            .data(vis.dataGrouped, d => d)
            .join('g')
            .attr('class', 'node')
            .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`)
            .on('click', function () {
                const name = this.querySelector('text').innerHTML
                vis.dispatcher.call('detail_click', {name: name})
            })
            .on('mouseover', function () {
                // TODO do classed hover and show tooltip (m3)
            })


        vis.circles = vis.node.append('circle')
            .attr('r', d => vis.radiusScale(d[1]))
            .attr('fill', 'red')

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

        vis.sim = d3.forceSimulation(vis.dataGrouped,function (d, idx){
            return d ? d.name : this.getAttribute("ID");
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
            })
    }

    dragStart(d, sim) {
        sim.alphaTarget(0.3).restart();
    }

    drag(d) {
        d.subject.x = d.x;
        d.subject.y = d.y;
    }

    dragEnd(d, sim) { // stop the bubbles from moving around after user is done
        sim.alphaTarget(0);
    }
}


