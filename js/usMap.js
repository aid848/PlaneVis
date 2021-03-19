class USMap {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     * @param {Array}
     * @param {Array}
     *
     */
    constructor(_config, _crashData, _statesData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || { top: 25, right: 20, bottom: 20, left: 35 },
            tooltipPadding: _config.tooltipPadding || 15

        };
        this.crashData = _crashData;
        this.statesData = _statesData;
        this.initVis();
    }
    initVis() {
        let vis = this;
        vis.updateVis()
    }

    updateVis(){
        let vis = this;
        vis.renderVis()
    }

    renderVis() {
            let vis = this;
            let usMap = d3.select("#us-map");
            let tooltip = d3.select("#tooltip");
            usMap
                .selectAll("path")
                .data(vis.statesData)
                .enter()
                .append("path")
                .attr("d", d3.geoPath())
                .attr("class", "state")
                .attr("fill", "white")
                .attr("stroke", "black")
                // .attr("data-fips", (item) => {
                //     return item["id"];
                // })
                // .attr("data-education", (item) => {
                //     let fips = item["id"];
                //     let county = vis.educationData.find((county) => {
                //         return county["fips"] === fips;
                //     });
                //     let percentage = county["bachelorsOrHigher"];
                //     return percentage;
                // })
                .on("mouseover", (item) => {
                    tooltip.transition().style("visibility", "visible");

                    tooltip.text(
                        "HELLO"
                    );

                    tooltip.attr("hi");
                })
                .on("mouseout", () => {
                    tooltip.transition().style("visibility", "hidden");
                });
        }
}