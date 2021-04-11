class FlightPhase {

    constructor(_config, _data) {

        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1300,
            containerHeight: _config.containerHeight || 800,
            margin: _config.margin || {top: 40, right: 25, bottom: 40, left: 25}
        };

        this.flightPathPoints = [
            {x: -40, y: 350, phase: null},      // starting point
            {x: 70, y: 350, phase: "Taxi"},     // 1st phase: taxi
            {x: 250, y: 350, phase: "Take Off"}, // 2nd phase: take off
            {x: 325, y: 350, phase: null},       // corner
            {x: 375, y: 275, phase: "Climb"},    // 3rd phase: climb
            {x: 450, y: 200, phase: null},       // corner
            {x: 550, y: 200, phase: "Cruise"},   // 4th phase: cruise
            {x: 750, y: 200, phase: "Maneuver"}, // 5th phase: maneuver
            {x: 800, y: 200, phase: null},       // corner
            {x: 875, y: 275, phase: "Approach"}, // 6th phase: approach
            {x: 950, y: 350, phase: null},       // corner
            {x: 1100, y: 350, phase: "Landing"},  // 7th phase: landing
            {x: 1260, y: 350, phase: "Summary"},  // summary
            {x: 1300, y: 350, phase: null}        // ending point
        ];

        this.validPhasePoints = this.flightPathPoints.filter(d => d.phase !== null);
        this.animatedStops = this.flightPathPoints.slice(0,1);
        this.data = _data;

        // initiate svg
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Update width and height with according margins
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Initialize flight path
        // https://github.com/d3/d3-shape#curveBasis
        vis.flightPathGenerator = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveBasis);

        vis.flightCategories = d3.scaleOrdinal()
            .domain(this.validPhasePoints.map(d => d.phase));

        // // vertical
        // vis.xScale = d3.scaleLinear()
        //     .domain([200, 350])
        //     .range([0, 150]);
        //
        // // horizontal
        // vis.yScale = d3.scaleLinear()
        //     .domain([d3.min(vis.flightPathPoints), d3.max(vis.flightPathPoints)])
        //     .range([0, vis.width]);

        // https://www.d3-graph-gallery.com/graph/pie_basic.html
        // set the color scale
        vis.globalColor = d3.scaleOrdinal()
            .domain(["Commercial", "Personal"])
            .range(["#0024d6", "#d60004"]);

        vis.pie = d3.pie();

        // shape helper to build arcs:
        vis.arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(70)

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Move chart to margin area
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // initialize path
        vis.flightPath = vis.chart.append('path')
            .datum(vis.flightPathPoints)
            .attr('d', vis.flightPathGenerator)
            .attr('stroke', 'lightgrey')
            .attr("stroke-width", 5)
            .attr('fill', 'none');

        // prepare plane at initial stop, before user enters the flight phase view
        vis.animationPath = vis.chart.append("path")
            .attr("class", "animation-path")
            .attr("d", vis.flightPathGenerator(vis.animatedStops))
            .attr("fill", "none");

        // flight marker to be animated along the path
        vis.fightMarker = vis.chart.append("image")
            .attr("xlink:href", "figs/icons8-fighter-jet-48.png")
            .attr('y', -10);

        // https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-interactive-line-chart?file=/js/linechart.js:1923-2008
        // tracking area is on top of other chart elements
        // TBD
        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        vis.pieGroup = vis.chart.append('g')
    }

    updateVis(forward=true, nextStop = -1) {
        let vis = this;

        // Specify accessor functions
        vis.xValue = d => d["Flight Phase General"];

        // Compute the position of each group on the pie:
        vis.pie.value(d => d.value);

        if (nextStop !== -1) {
            // update animation path to stop at nextStop, assuming only scrolling down
            // get the initial stop in updated animation path
            const pathBegin = nextStop === 0 ?
                nextStop // enter first stop, i.e. Taxi
                :
                vis.flightPathPoints.findIndex(
                    (stop, idx) => stop.phase === vis.validPhasePoints[nextStop-1].phase
                );

            // get the end stop in updated animation path
            const pathEnd = pathBegin < 12 && vis.flightPathPoints.findIndex(
                (stop) => stop.phase === vis.validPhasePoints[nextStop].phase
                );

            vis.animatedStops = pathBegin < 12 ?
                this.flightPathPoints.slice(pathBegin, pathEnd+1)
                :
                this.flightPathPoints.slice(pathBegin); // if reached last stop, i.e. summary

            console.log(pathBegin < 12, vis.animatedStops, pathEnd)

            // reverse the flying order if scrolled up
            vis.animatedStops = forward ? vis.animatedStops : vis.animatedStops.reverse();
        }

        // let data_ready = vis.pie(d3.entries(data));
        vis.renderVis();
    }

    // Binding data to visual elements;
    // Called every time the data or configurations change
    renderVis() {
        let vis = this;

        vis.animationPath
            .attr("d", vis.flightPathGenerator(vis.animatedStops));

        vis.fightMarker.transition()
            .duration(1000)
            .attrTween("transform", vis.translateAlong(vis.animationPath.node()));

        // phase container
        // const phaseG = vis.chart.selectAll('stop')
        //     .data(vis.validPhasePoints, d => d.phase)
        //     .join('g')
        //     .attr('class', 'stop');

        // phase-phase positions
        vis.chart.selectAll('circle')
            .data(vis.validPhasePoints)
            .join('circle')
            .attr('class', 'stop')
            .attr('id', d => d.phase)
            .attr('r', 4)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)

        vis.chart.selectAll('text')
            .data(vis.validPhasePoints, d => d.phase)
            .join('text')
            .attr('dy', 30)
            .attr('transform', d => {
                if (d.phase === "Climb")
                    return `translate(${d.x}, ${d.y}) rotate(-53)`;
                else if (d.phase === "Approach")
                    return `translate(${d.x}, ${d.y}) rotate(45)`;
                return `translate(${d.x}, ${d.y})`
            })
            .attr('text-anchor', d => {
                if (d.phase === "Start")
                    return "start";
                else if (d.phase === "Summary")
                    return "end";
                return "middle"
            })
            .text(d => d.phase)

        // // pie groups
        // let pieG = vis.pieGroup.selectAll('.pie-container')
        //     .data(vis.data, d => d[0])
        //     .join('g')
        //     .filter(d => {
        //         return vis.validPhasePoints.find(p => d[0].includes(p.phase.toUpperCase().replace(/\s/g, '')))
        //     })
        //     .attr('class', 'pie-container')
        //     .attr('id', d => d[0].toLowerCase())
        //     .attr('transform', d => {
        //         let point = vis.validPhasePoints.find(p => d[0].includes(p.phase.toUpperCase().replace(/\s/g, '')))
        //         return `translate(${point.x}, ${point.y - 100})`
        //     });
        //
        // // add active class
        // // .filter TODO: for scrolling later (m3)
        //
        // let pie = pieG.selectAll('.pie-chart')
        //     .data(d => {
        //         const phaseData = d[1];
        //         const commercialData = phaseData[0][0] === false ? phaseData[0] : phaseData[1];
        //         const personalData = phaseData[1][0] === true ? phaseData[1] : phaseData[0];
        //         const data = {
        //             "Commercial": commercialData[1].length,
        //             "Personal": personalData[1].length
        //         };
        //         const keyValuePair = Array.from(Object.entries(data),
        //             ([key, value]) => ({key, value}));
        //         return vis.pie(keyValuePair)
        //     }, d => d[1]);
        //
        // pie.join('path')
        //     .attr('d', vis.arcGenerator)
        //     .attr('fill', d => {
        //         // console.log(d.data, vis.globalColor(d.data.key))
        //         return vis.globalColor(d.data.key)
        //     })
        //     .attr("stroke", "black")
        //     .style("stroke-width", "2px")
        //     .style("opacity", 0.7);
        //
        // // annotation
        // // TODO: lines: http://bl.ocks.org/dbuezas/9306799
        // pie.join('text')
        //     .text(d => d.data.key)
        //     .attr("transform", d => `translate(${vis.arcGenerator.centroid(d)})`)
        //     .style("text-anchor", "middle")
        //     .style("font-size", 17)
        //     .style("color", "white");


        // TBD
        // vis.trackingArea.on("mousemove", function(event) {
        //     vis.fightMarker
        //         .attr("cx", d3.pointer(event, this)[0])
        //         .attr("cy", d3.pointer(event, this)[1]);
        // });
    }

    // helper for plane's animation along path
    translateAlong(path) {
        let l = path.getTotalLength();
        let t0 = 0;
        return function () {
            return function (t) {
                let p0 = path.getPointAtLength(t0 * l);//previous point
                let p = path.getPointAtLength(t * l);////current point
                let angle = Math.atan2(p.y - p0.y, p.x - p0.x) * 180 / Math.PI;//angle for tangent
                t0 = t;
                //Shifting center to center of rocket
                let centerX = p.x - 24,
                    centerY = p.y - 12;
                return "translate(" + centerX + "," + centerY + ")rotate(" + angle + " 24" + " 12" + ")";
            }
        }
    }

}
