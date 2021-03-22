class GeoMap {

    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _geoData, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            tooltipPadding: 10
        }
        this.geoData = _geoData;
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
            . translate([width/2, height/2])    // translate to center of screen
            .scale([1000]);

        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.symbolScale = d3.scaleSqrt()
            .range([4, 25]);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.symbolScale.domain(d3.extent(vis.data, d => d.visitors));

        console.log(vis.data);

        vis.data = vis.data.filter(d =>
            vis.projection([d.Longitude,d.Latitude]) != null
        );
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
console.log(vis.data);
        // Append symbols
        const geoSymbols = vis.chart.selectAll('.geo-symbol')
            .data(vis.data)
            .join('circle')
            .attr('class', 'geo-symbol')
            .attr('r', "5px")
            .attr('cx', d => vis.projection([d.Longitude,d.Latitude])[0])
            .attr('cy', d => vis.projection([d.Longitude,d.Latitude])[1]);

                        // Tooltip event listeners
                    geoSymbols
                    .on('mousemove', (event,d) => {
                    d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
                    .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
                    .html(`
              <div class="tooltip-title">${d.name}</div>
              <div>${d.country}&nbsp; | &nbsp;${d.visitors} mio. visitors</div>
            `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        // Append text labels to show the titles of all sights
        const geoSymbolLabels = vis.chart.selectAll('.geo-label')
            .data(vis.data)
            .join('text')
            .attr('class', 'geo-label')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('x', d => vis.projection([d.Longitude,d.Latitude])[0])
            .attr('y', d => vis.projection([d.Longitude,d.Latitude])[1])
            .text(d => d.name);

        // Append text labels with the number of visitors for two sights (to be used as a legend)
        const geoSymbolVisitorLabels = vis.chart.selectAll('.geo-visitor-label')
            .data(vis.data)
            .join('text')
            .filter(d => d.showLabel)
            .attr('class', 'geo-visitor-label')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('x', d => vis.projection([d.Longitude,d.Latitude])[0])
            .attr('y', d => (vis.projection([d.Longitude,d.Latitude])[1] + vis.symbolScale(d.visitors) + 12))
            .text(d => `${d.visitors} mio. visitors`);
    }
}