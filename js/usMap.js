class USMap {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     * @param {Array}
     * @param {Array}
     *
     */
    constructor(_config, _data, _educationData, _countyData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || { top: 25, right: 20, bottom: 20, left: 35 },
            tooltipPadding: _config.tooltipPadding || 15

        };
        this.data = _data;
        this.countyData = _countyData;
        this.educationData = _educationData;
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
        let canvas = d3.select("#canvas");
        let tooltip = d3.select("#tooltip");

        canvas
            .selectAll("path")
            .data(vis.countyData)
            .enter()
            .append("path")
            .attr("d", d3.geoPath())
            .attr("class", "county")
            .attr("fill", (item) => {
                let fips = item["id"];
                let county = vis.educationData.find((county) => {
                    return county["fips"] === fips;
                });
                let percentage = county["bachelorsOrHigher"];
                if (percentage <= 15) {
                    return "tomato";
                } else if (percentage <= 30) {
                    return "orange";
                } else if (percentage <= 45) {
                    return "lightgreen";
                } else {
                    return "limegreen";
                }
            })
            .attr("data-fips", (item) => {
                return item["id"];
            })
            .attr("data-education", (item) => {
                let fips = item["id"];
                let county = vis.educationData.find((county) => {
                    return county["fips"] === fips;
                });
                let percentage = county["bachelorsOrHigher"];
                return percentage;
            })
            .on("mouseover", (item) => {
                tooltip.transition().style("visibility", "visible");

                let fips = item["id"];
                let county = vis.educationData.find((county) => {
                    return county["fips"] === fips;
                });

                tooltip.text(
                    county["fips"] +
                    " - " +
                    county["area_name"] +
                    ", " +
                    county["state"] +
                    " : " +
                    county["bachelorsOrHigher"] +
                    "%"
                );

                tooltip.attr("data-education", county["bachelorsOrHigher"]);
            })
            .on("mouseout", (item) => {
                tooltip.transition().style("visibility", "hidden");
            });
    }
}