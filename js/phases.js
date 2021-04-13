class FlightPhase {

    constructor(_config, _data, _dispatcher) {

        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1300,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 0, right: 25, bottom: 0, left: 25}
        };

        this.flightPathPoints = [
            {x: -70, y: 350, phase: null},      // starting point
            {x: 70, y: 350, phase: "Taxi"},     // 1st phase: taxi
            {x: 225, y: 350, phase: "Take Off"}, // 2nd phase: take off
            {x: 325, y: 350, phase: null},       // corner
            {x: 375, y: 275, phase: "Climb"},    // 3rd phase: climb
            {x: 450, y: 200, phase: null},       // corner
            {x: 550, y: 200, phase: "Cruise"},   // 4th phase: cruise
            {x: 750, y: 200, phase: "Maneuver"}, // 5th phase: maneuver
            {x: 800, y: 200, phase: null},       // corner
            {x: 900, y: 300, phase: "Approach"}, // 6th phase: approach
            {x: 950, y: 350, phase: null},       // corner
            {x: 1100, y: 350, phase: "Landing"},  // 7th phase: landing
            {x: 1260, y: 350, phase: "Summary"},  // summary
            {x: 1300, y: 350, phase: null}        // ending point
        ];

        // dispatcher to connect with stacked bar chart, to send phase name
        this.dispatcher = _dispatcher;

        this.validPhasePoints = this.flightPathPoints.filter(d => d.phase !== null);
        this.animatedStops = this.flightPathPoints.slice(0,1);

        // change all phase names to capital
        this.phaseNameUpperCase = this.validPhasePoints.map(p => {
            return p.phase.toUpperCase().replace(/\s/g, '')
        });

        this.data = _data.filter((d) => {
            // preprocess wanted data points here
            return this.phaseNameUpperCase.find(p => d[0].includes(p))
        });

        this.dataPieChart = [];

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
            .attr('height', vis.config.containerHeight)
            .attr('id', 'flight-path');

        // Move pathView to margin area
        vis.pathView = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        // initialize path
        vis.flightPath = vis.pathView.append('path')
            .datum(vis.flightPathPoints)
            .attr('d', vis.flightPathGenerator)
            .attr('stroke', 'lightgrey')
            .attr("stroke-width", 5)
            .attr('fill', 'none');

        // prepare plane at initial stop, before user enters the flight phase view
        vis.animationPath = vis.pathView.append("path")
            .attr("class", "animation-path")
            .attr("d", vis.flightPathGenerator(vis.animatedStops))
            .attr("fill", "none");

        // phase container
        const phaseG = vis.pathView.selectAll('.stop')
            .data(vis.validPhasePoints, d => d.phase)
            .join('g')
            .attr('class', 'stop');

        // phase-phase positions
        phaseG.selectAll('circle')
            .data(d => [d], d => d.phase)
            .join('circle')
            .attr('class', 'stop')
            .attr('id', d => d.phase)
            .attr('r', 4)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        phaseG.selectAll('text')
            .data(d => [d], d => d.phase)
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
            .attr('fill', '#fdf1e7')
            .text(d => d.phase);

        // flight marker to be animated along the path
        vis.fightMarker = vis.pathView.append("image")
            .attr("xlink:href", "figs/icons8-fighter-jet-48.png")
            .attr('y', -10);

        vis.pieGroup = vis.pathView.append('g')
            .attr('class', 'pie-pathView-group');
    }

    updateVis(forward=true, nextStop = -1) {
        let vis = this;

        // Specify accessor functions
        vis.xValue = d => d["Flight Phase General"];

        // Compute the position of each group on the pie:
        vis.pie.value(d => d.value).sort(null);

        let reachSummary = false;

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

            reachSummary = !pathEnd || forward && pathEnd === 12;

            vis.animatedStops = pathBegin < 11 ?
                this.flightPathPoints.slice(pathBegin, pathEnd+1)
                :
                this.flightPathPoints.slice(pathBegin); // if reached last stop, i.e. summary

            // reverse the flying order if scrolled up
            vis.animatedStops = forward ? vis.animatedStops : vis.animatedStops.reverse();

            // filter data to include only the data of the stops
            const interestedPoints = forward ?
                vis.phaseNameUpperCase.slice(0, nextStop+1)
                :
                vis.phaseNameUpperCase.slice(0, nextStop);

            vis.dataPieChart = vis.data.filter((d) => {
                    const poi = interestedPoints.findIndex(p => d[0].includes(p));
                    return poi === -1 ? undefined : vis.validPhasePoints[poi]
                });
        }

        vis.renderVis(forward, reachSummary, nextStop);
    }

    // Binding data to visual elements;
    // Called every time the data or configurations change
    renderVis(forward, reachSummary, nextStop) {
        let vis = this;

        vis.animationPath
            .attr("d", vis.flightPathGenerator(vis.animatedStops));

        vis.fightMarker.transition()
            .duration(1000)
            .attrTween("transform", vis.translateAlong(vis.animationPath.node()))
            .on("start", function(event) {
                if (nextStop !== -1 && !reachSummary) {
                    if (forward) {
                        vis.dispatcher.call('filterPhaseData', event, vis.phaseNameUpperCase[nextStop]);
                    } else {
                        vis.dispatcher.call('filterPhaseData', event, vis.phaseNameUpperCase[nextStop-1]);
                    }
                }
            });

        if (forward && reachSummary) {
            // hide path view when reached summary
            const top = d3.select("#summary-container").node().getBoundingClientRect().top;

            vis.pathView.transition()
                .duration(1000)
                .ease(d3.easeLinear).style("opacity", 0)
                // move to summary section at end
                .on("start", function(event) {
                    vis.dispatcher.call('filterPhaseData', event, "Summary");
                    vis.dispatcher.call('reachedSummary', event, true);
                })
                .on("end", d => window.scrollBy({top: top, behavior: 'smooth'}));
        } else {
            vis.pathView.transition()
                .duration(1500)
                .ease(d3.easeLinear).style("opacity", 1)
                .on("start", function(event) {
                    vis.dispatcher.call('reachedSummary', event, false);
                });

            // pie groups
            let pieG = vis.pieGroup.selectAll('.pie-container')
                .data(vis.dataPieChart, d => d[0])
                .join('g')
                .attr('class', 'pie-container')
                .attr('id', d => d[0].toLowerCase())
                .attr('transform', d => {
                    const i = vis.phaseNameUpperCase.findIndex(p => d[0].includes(p));
                    const point = vis.validPhasePoints[i];
                    if (point.phase === 'Climb')
                        return `translate(${point.x - 10}, ${point.y - 100})`
                    else if (point.phase === 'Approach')
                        return `translate(${point.x + 20}, ${point.y - 100})`
                    return `translate(${point.x}, ${point.y - 100})`
                });

            let pieInfo = pieG.selectAll('g')
                .data(d => {
                    const phaseData = d[1];
                    const personalData = phaseData[0][0] === true ? phaseData[0] : phaseData[1];
                    const commercialData = phaseData[0][0] === true ? phaseData[1] : phaseData[0];
                    const data = {
                        "Commercial": commercialData[1].length,
                        "Personal": personalData[1].length
                    };
                    const keyValuePair = Array.from(Object.entries(data),
                        ([key, value]) => ({key, value}));
                    return vis.pie(keyValuePair)
                }, d => d[0])
                .join('g');

            pieInfo.selectAll('path')
                .data(d => [d])
                .join('path')
                .attr('d', vis.arcGenerator)
                .attr('fill', d => {
                    return vis.globalColor(d.data.key)
                })
                .attr("stroke", "black")
                .style("stroke-width", "2px");
            // annotation
            pieInfo.selectAll('text')
                .data(d => [d])
                .join('text')
                .text(d => d.data.value)
                .attr("transform", d => `translate(${vis.arcGenerator.centroid(d)})`)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("fill", "white");

            pieG.filter((d) => {
                const poi = vis.phaseNameUpperCase.findIndex(p => d[0].includes(p));
                const stop = vis.validPhasePoints[poi];
                const length = vis.animatedStops.length;
                const lastStop = vis.animatedStops[length - 1];

                // get the last stop of flight and do transition
                return forward && stop.x === lastStop.x && stop.y === lastStop.y
            }).style("opacity", 0.1)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear).style("opacity", 0.7);
        }
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
