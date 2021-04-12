class StackedBarChart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 250,
            margin: {top: 10, right: 10, bottom: 30, left: 90},
            displayType: 'absolute',
            legendWidth: 300,
            legendTitleHeight: 12,
            legendBarHeight: 14,
            injuries : ['Total Fatal Injuries', 'Total Serious Injuries', 'Total Minor Injuries'],
        }
        this.data = _data;
        this.initVis();
    }

    /**
     * Initialize scales/axes and append static chart elements
     */
    initVis() {
        let vis = this;

        vis.colors = ["#b33040", "#d25c4d", "#f2b447", "#d9d574"];

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .paddingInner(0.2)
            .paddingOuter(0.2);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(6);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.legendSvg = d3.select("#chart-legend")
            .attr('width', "400px")
            .attr('height', "100px")



        // Empty group for the legend
        vis.legend = vis.legendSvg.append('g')
            .attr('transform', `translate(0,30)`);


        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        let injuries = ['Total Fatal Injuries', 'Total Serious Injuries', 'Total Minor Injuries'];

        // Initialize stack generator and specify the categories or layers
        // that we want to show in the chart
        vis.stack = d3.stack()
            .keys(injuries);

        vis.updateVis();
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;
        //Todo: change to commercial or personal filtering non personal as commercial
        vis.xScale.domain(["Personal", "Commercial"]);


        // console.log(vis.data)
        vis.data = vis.data.filter(d => d['Purpose of Flight'] != "" || d['Purpose of Flight'] != "Unknown");

        vis.groupedData = d3.rollups(
            vis.data,
            xs => {
                return [d3.sum(xs, x => x["Total Minor Injuries"]), d3.sum(xs, x => x["Total Serious Injuries"]), d3.sum(xs, x => x["Total Fatal Injuries"])]
            },
            d => d["Purpose of Flight"] === "Personal",
        )
            .map(([k, v]) => ({
                "Purpose of Flight": k ? "Personal" : "Commercial",
                'Total Minor Injuries': v[0],
                'Total Serious Injuries': v[1],
                'Total Fatal Injuries': v[2]
            }));

        vis.yScale.domain([0, d3.max(vis.groupedData, d => {
            const total = d['Total Fatal Injuries'] + d['Total Serious Injuries'] + d['Total Fatal Injuries']
            const roundThousands = (parseInt(total / 1000)+2)*1000;
            return roundThousands < 40000 ? roundThousands : 70000
        })]);

        vis.stackedData = vis.stack(vis.groupedData);

        vis.renderLegend();
        vis.renderVis();
    }

    /**
     * This function contains the D3 code for binding data to visual elements
     * Important: the chart is not interactive yet and renderVis() is intended
     * to be called only once; otherwise new paths would be added on top
     */
    renderVis() {
        let vis = this;

        if (vis.data.length === 0) {
            vis.svg
                .transition()
                .duration(500)
                .ease(d3.easeLinear)
                .style("opacity", 0)
        } else {
            vis.svg
                .transition()
                .duration(1000)
                .ease(d3.easeLinear)
                .style("opacity", 1)
        }

        const category = vis.chart.selectAll('.category')
            .data(vis.stackedData)
        // enter
        const categoryEnter = category.enter().append('g')
            .attr('class', d => `category ${d.key}`)

        // enter + update groups
        categoryEnter.merge(category)

        // Exit
        categoryEnter.exit().remove();

        // console.log(vis.stackedData)
        const rectangle = category.merge(categoryEnter).selectAll('.rectangle')
            .data(d => d)

        const rectangleEnter = rectangle.enter().append('rect')
            .attr('class', 'rectangle')

        rectangle.merge(rectangleEnter)
            .attr('x', d => vis.xScale(d.data["Purpose of Flight"]))
            .attr('y', d => vis.yScale(d[1]))
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .attr('width', vis.xScale.bandwidth())
            .style('fill', d => {
                return d.data["Purpose of Flight"] === "Personal" ? "#db0004" : "#0700db"
            });

        rectangleEnter.exit().remove();


        // vis.chart.selectAll('category')
        //     .data(vis.stackedData, d => d.key )
        //     .join('g')
        //         .attr('class', d => `category ${d.key}`)
        //     .selectAll('rect')
        //         .data(d => d)
        //     .join('rect')
        //         .attr('x', d => vis.xScale(d.data["Purpose of Flight"]))
        //         .attr('y', d => vis.yScale(d[1]))
        //         .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        //         .attr('width', vis.xScale.bandwidth());

        // Update the axes
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
    /**
     * Add categorical colour legend
     */
    renderLegend() {
        const vis = this;

        // Inititalize categorical scale
        const xLegendScale = d3.scaleBand()
            .domain(vis.config.injuries)
            .range([0, vis.config.legendWidth])
            .paddingInner(0);

        // Add coloured rectangles
        vis.legend.selectAll('.legend-element')
            .data(vis.config.injuries)
            .join('rect')
            .attr('class', d => `legend-element ${d}`)
            .attr('width', xLegendScale.bandwidth())
            .attr('height', vis.config.legendBarHeight)
            .attr('x', d => xLegendScale(d))
            .attr('y', vis.config.legendTitleHeight)
            .on('mouseover', (event,d) => {
                d3.selectAll(`.cat:not(.cat-${d})`).classed('inactive', true);
            })
            .on('mouseout', () => {
                d3.selectAll(`.cat`).classed('inactive', false);
            });

        // Add legend title
        vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '0.35em')
            .text('Injury Severity:')
            .attr('transform', `translate(0,-10)`);

        const legendAxisYPos = vis.config.legendTitleHeight + vis.config.legendBarHeight + 5;

        vis.legend.append('text')
            .attr('class', 'legend-axis-text')
            .attr('dy', '0.75em')
            .attr('y', legendAxisYPos)
            .attr('x', 30)
            .text('Fatal')
            .attr('transform', `translate(0,7)`);


        vis.legend.append('text')
            .attr('class', 'legend-axis-text')
            .attr('dy', '0.75em')
            .attr('y', legendAxisYPos)
            .attr('x', 120)
            .text('Serious')
            .attr('transform', `translate(0,7)`);


        vis.legend.append('text')
            .attr('class', 'legend-axis-text')
            .attr('dy', '0.75em')
            .attr('y', legendAxisYPos)
            .attr('x', 230)
            .text('Minor')
            .attr('transform', `translate(0,7)`);

    }
}
