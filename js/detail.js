// Overview from primary selector, tooltip and click to highlight changes map view, ordered sort, physics?

class Detail {
    constructor(_data, _parent_element, _dispatcher, _attr,lookup) {
        this.data = _data
        this.parent_element = _parent_element
        this.dispatcher = _dispatcher
        this.lookup = lookup
        this.width = window.innerWidth * 0.27
        this.height = window.innerHeight * 0.5
        this.maxCircleSize = 100
        this.minCircleSize = 10
        this.padding = 5
        this.selected = "BOEING"
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
        vis.sizeScale = d3.scaleLinear().range([vis.minCircleSize, vis.maxCircleSize])
        vis.sizeScaleInverted = d3.scaleLinear().range([vis.maxCircleSize,vis.minCircleSize])

        vis.yAxisGroup = vis.svg
            .append("g")
            .attr("class", "axis y-axis")
            .attr('height', 150)
            .attr('transform', `translate(${vis.padding*2},${vis.height/2})`)

        vis.yAxis = d3.axisRight(vis.sizeScale).ticks(3)

        vis.title = vis.chart
            .append('text')
            .attr('x', 0)
            .attr('y', vis.padding*6)
            .attr('class','bubble-title')
            .text(`${secondary_selector} by Aircraft Make (${vis.selected})`)

        vis.updateVis()
    }

    updateVis() {
        const vis = this
        // change domain for scales based on new data and limit to max elements
        if(vis.data.length < 25 ){
            vis.maxElements = vis.data.length;
        } else {
            vis.maxElements = 25;
        }
        vis.dataGrouped = vis.data.slice(0, vis.maxElements)
        vis.sizeScale.domain([vis.dataGrouped[vis.maxElements - 1][1], vis.dataGrouped[0][1]])
        vis.sizeScaleInverted.domain([vis.dataGrouped[0][1],vis.dataGrouped[vis.maxElements - 1][1]])
        d3.selectAll(vis.title).text(`${secondary_selector} by Aircraft Model (${vis.selected})`)
        vis.renderVis()
    }

    renderVis() {
        const vis = this

        // patch sub elements duplications, (limited to only a few rogue elements of the force directed sim)
        d3.selectAll(vis.txt).remove()
        d3.selectAll(vis.circles).remove()
        d3.selectAll(vis.textlabels).remove()

        vis.node = vis.chart
            .selectAll('g')
            .data(vis.dataGrouped, d=> [d[0],vis.sizeScale(d[1])])
            .join('g')
            .attr('class', 'node-detail')
            .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`)
            .style("margin", 3)
            .on('click', function () {
                const name = this.querySelector('image').getAttribute('plane')
                vis.dispatcher.call('detail_click', {name: name})
            })
            .on('mouseenter', function (event, d) {
                // tooltip for models
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY + "px")
                    .html(
                        `<div class="tooltip-window">
                        <p>${vis.selected}</p>
                        <p>Model: ${d[0]}</p> 
                        <p>${secondary_selector} ${d[1].toFixed(0)}</p>
                        </div>`
                    );
            }).on('mouseout', function (event,d) {
                d3.select('#tooltip')
                    .style('display', 'none')
            })


        // plane images appending here
        vis.circles = vis.node.append('image')
            .attr("xlink:href", d=> {return vis.planeConfigToImage(d[0])})
            .attr('width', d => vis.sizeScale(d[1]))
            .attr('height', d => vis.sizeScale(d[1]))
            .attr('plane', d=>d[0])

        // plane labels here
        vis.txt = vis.node
            .append('text')
            .attr("text-anchor", "middle")
            .attr('x', d=>vis.sizeScale(d[1])/2)
            .style("font-size",14)
            .text(d => {
                return d[0]
            })



        // enable force simulation for element groups
        vis.sim = d3.forceSimulation(vis.dataGrouped,d=> [d[0],vis.sizeScale(d[1])])
            .force("x", d3.forceX(vis.width / 2).strength(0.005))
            .force("y", d3.forceY(vis.height / 2).strength(0.005))
            .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5).strength(0.2))
            .force('charge', d3.forceManyBody().strength(-5))
            .force('collide',  d3.forceCollide(28).strength(2).iterations(1))
            .on("tick", function () {
                vis.node.enter()
                    .append('g')
                    .merge(vis.node)
                    .attr('transform', function (d) {
                        let x = d.x
                        let y = d.y
                        let rad = vis.sizeScale(d[1])
                        if (x > vis.width - vis.padding - rad) {
                            x = vis.width - vis.padding - rad
                        } else if (x -vis.padding < 0) {
                            x = vis.padding
                        }
                        if (y > vis.height - vis.padding - rad) {
                            y = vis.height - vis.padding - rad
                        } else if (y - vis.padding*2 < 0) {
                            y = vis.padding*2
                        }
                        return `translate(${x},${y})`
                    })
                    .call(d3.drag() // call specific function when circle is dragged
                        .on("start", d => vis.dragStart(d, vis.sim))
                        .on("drag", vis.drag)
                        .on("end", d => vis.dragEnd(d, vis.sim)));
                vis.node.exit().remove()
                d3.selectAll(vis.circles).exit().remove()
                d3.selectAll(vis.txt).exit().remove()
            })

        vis.yAxisGroup.call(vis.yAxis)//.call((g) => g.select(".domain").remove());
    }

    dragStart(d, sim) { // restart movement of sim
        sim.alphaTarget(0.3).restart();
    }

    drag(d) { // remove tooltip and allow plane to move by mouse
        d3.select('#tooltip')
            .style('display', 'none')
        d.subject.x = d.x;
        d.subject.y = d.y;
    }

    dragEnd(d, sim) { // stop the bubbles from moving around after user is done
        sim.alphaTarget(0);
    }

    planeConfigToImage(model){ // map plane config to figure
        let vis = this
        let type = vis.lookup.get(model)[0]
        let engines = vis.lookup.get(model)[1]

        switch (type){
            case 'Reciprocating':
            case 'REC, TJ, TJ': // small plane with prop and car like engine here
                return 'figs/Reciprocating.png'
            case 'Turbo Shaft': // helicopter img here
                    return "figs/heli.png"
            case 'Turbo Fan': // regular commercial jet image (check if 2 or 4 engines, or generic)
            case 'Turbo Jet':
                if(engines === 2){
                    return "figs/turbo2engine.png"
                }else if(engines === 4){
                    return "figs/turbo4engine.png"
                }else {
                    return "figs/turboNengine.png"
                }
            case 'Turbo Prop': // classic larger prop plane
                return 'figs/turboprop.png'
            case 'Unknown': // generic cartoon plane image
            default:
                return "figs/planeGeneric.png"
        }

    }

}


