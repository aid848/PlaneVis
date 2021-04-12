class UsMap {
    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _geoData, _data, _attr) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            tooltipPadding: 10
        }
        this.geoData = _geoData;
        this.attribute = _attr
        this.data = _data;
        this.initVis();
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;
        let width = vis.config.containerWidth;
        let height = vis.config.containerHeight;
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Defines the scale and translate of the projection so that the geometry fits within the SVG area
        // We crop Antartica because it takes up a lot of space that is not needed for our data
        vis.projection = d3.geoAlbersUsa()
            .translate([width / 2, height / 2])    // translate to center of screen
            .scale([1000]);

        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.symbolScale = d3.scaleSqrt()
            .range([4, 25]);

        vis.hexbin = d3.hexbin().extent([[0, 0], [width, height]]).radius(10);
        vis.hexbin.x(d => vis.projection([d.Longitude, d.Latitude])[0]);
        vis.hexbin.y(d => vis.projection([d.Longitude, d.Latitude])[1]);


        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        console.log(vis.filteredData);

        vis.filteredData = vis.data.filter(d =>
            vis.projection([d.Longitude, d.Latitude]) != null
        );


        vis.hexData = vis.hexbin(vis.filteredData)
            .map(d => (d.binMetric = d3.sum(d, d => d[vis.attribute]), d))
            .sort((a, b) => b.length - a.length);

        vis.color = d3.scaleSequential(d3.extent(vis.hexData, d=> d3.sum(d, d => d[vis.attribute])), d3.interpolateOrRd);
        vis.radius = d3.scaleSqrt([0, d3.max(vis.hexData, d => d.length)], [0, vis.hexbin.radius() * Math.SQRT2]);

        vis.renderVis();
    }


    renderVis() {
        let vis = this;
        // Append world map
        const geoPath = vis.chart.selectAll('.geo-path')
            .data(topojson.feature(vis.geoData, vis.geoData.objects.states).features)
            .join('path')
            .attr('class', 'geo-path')
            .attr('d', vis.geoPath);

        // Append country borders
        const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
            .data([topojson.mesh(vis.geoData, vis.geoData.objects.states)])
            .join('path')
            .attr('class', 'geo-boundary-path')
            .attr('d', vis.geoPath);

        // Append hexbin
        const hexbin = vis.svg.selectAll(".hex-bin-path")
            .data(vis.hexData, d => [d.x, d.y])
            .join("path")
            .attr('class', 'hex-bin-path')
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("d", d => vis.hexbin.hexagon(vis.radius(d.length)))
            .attr("fill", d => vis.color(d.binMetric))
            .attr("stroke", d => d3.lab(vis.color(d.binMetric)).darker())



        hexbin.on('mouseover', (event, d) => {
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
                  <div class="tooltip-title">hello</div>
                `);
        }).on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
        })
    }
}