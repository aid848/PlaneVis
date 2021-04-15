// Overview from primary selector, tooltip and click to highlight changes map view, ordered sort, physics?

class Overview {
  constructor(_data, _parent_element, _dispatcher, _attr) {
    this.data = _data;
    this.parent_element = _parent_element;
    this.dispatcher = _dispatcher;
    this.width = window.innerWidth * 0.65;
    this.height = window.innerHeight * 0.5;
    this.maxCircleSize = 75;
    this.minCircleSize = 30;
    this.padding = 5;
    this.maxElements = 30;
    this.legendStep = [25, 50, 75, 100];
    this.initVis();
  }

  initVis() {
    const vis = this;

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.parent_element)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height);

    vis.chart = vis.svg
      .append("g")
      .attr("transform", `translate(${vis.padding},${vis.padding})`)
      .attr("class", "chart")
      .attr("width", vis.width - vis.padding * 2)
      .attr("height", vis.height - vis.padding * 2);

    // scales
    vis.xScale = d3.scaleLinear();
    vis.radiusScale = d3
      .scaleSqrt()
      .range([vis.minCircleSize, vis.maxCircleSize]);
    vis.colorScale = d3.scaleSequential(d3.interpolateCividis);

    // legend
    vis.legend = vis.chart
      .selectAll("#legend-overview")
      .data(vis.legendStep)
      .enter()
      .append("circle")
      .attr("class", "legend-circle")
      .attr("cx", vis.padding + vis.maxCircleSize)
      .attr("cy", function (d) {
        return (
          vis.height -
          vis.padding * 2 -
          ((vis.maxCircleSize - vis.minCircleSize) * d) / 100 -
          vis.minCircleSize
        );
      })
      .attr("r", function (d) {
        return (
          ((vis.maxCircleSize - vis.minCircleSize) * d) / 100 +
          vis.minCircleSize
        );
      })
      .style("fill", "none")
      .attr("stroke", "black");

    // view text title
    vis.title = vis.chart
      .append("text")
      .attr("class", "bubble-title")
      .attr("x", 0)
      .attr("y", vis.padding * 6)
      .text(`${secondary_selector} by Aircraft Make`);

    vis.updateVis();
  }

  updateVis() {
    const vis = this;
    // change domain for scales based on new data and limit to max elements
    vis.dataAttributed = vis.data.slice(0, vis.maxElements);
    vis.radiusScale.domain([
      vis.dataAttributed[vis.maxElements - 1][1],
      vis.dataAttributed[0][1],
    ]);
    vis.colorScale.domain([
      vis.dataAttributed[vis.maxElements - 1][1],
      vis.dataAttributed[0][1],
    ]);
    d3.selectAll(vis.title).text(`${secondary_selector} by Aircraft Make`);
    vis.renderVis();
  }

  renderVis() {
    const vis = this;

    // patch sub elements duplications, (limited to only a few rogue elements of the force directed sim)
    d3.selectAll(vis.textlabels).remove();
    d3.selectAll(vis.circles).remove();

    // update text labels for legend
    vis.textlabels = vis.chart
      .selectAll("#legend-overview")
      .data(vis.legendStep, (d) => d)
      .join("text")
      .attr("class", "legend-label")
      .attr("x", vis.padding + vis.maxCircleSize)
      .attr(
        "y",
        (d) =>
          vis.height -
          vis.padding -
          2 *
            (((vis.maxCircleSize - vis.minCircleSize) * d) / 100 +
              vis.minCircleSize) -
          10
      )
      .text((d) => {
        let val = vis.radiusScale.invert(
          ((vis.maxCircleSize - vis.minCircleSize) * d) / 100 +
            vis.minCircleSize
        );
        return val.toFixed(0);
      });

    // setup nodes
    vis.node = vis.chart
      .selectAll("g")
      .data(vis.dataAttributed, function (d) {
        return [d[0], vis.radiusScale(d[1])];
      })
      .join("g")
      .attr("class", "node")
      .attr("transform", `translate(${vis.width / 2},${vis.height / 2})`)
      .on("click", function () {
        const name = this.querySelector("text").innerHTML;
        vis.dispatcher.call("overview_click", { name: name });
      })
      .on("mouseenter", function (event, d) {
        // tooltip for makes
        d3.select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
          .html(
            `<div class="tooltip-window">
                <p class="tooltip-title title-center">${d[0]}</p> 
                <p>
                    <span class="tooltip-secondary-title">${secondary_selector}:</span>
                    <span> ${d[1].toFixed(0)}</span>
                </p>
              </div>`
          );
      })
      .on("mouseout", function (event, d) {
        d3.select("#tooltip").style("display", "none");
      });

    // bubble chart circle sub elements
    vis.circles = vis.node
      .append("circle")
      .attr("r", (d) => vis.radiusScale(d[1]))
      .attr("fill", (d) => {
        return vis.colorScale(d[1]);
      });

    // text labels for bubbles
    vis.node
      .append("text")
      .attr("text-anchor", "middle")
      .style('fill', function (d){
        let ep = 0.85
        if( vis.radiusScale(d[1]) > ep*vis.maxCircleSize) {
          return 'black'
        }
        return 'white'
      })
      .style("font-size", function (d) {
        let r = d3.select(this.parentNode.querySelector("circle")).attr("r");
        let len = d[0].length;
        return Math.min(r / 3, (r * 2) / len) + "px";
      })
      .text((d) => {
        return d[0];
      });

    // setup force sim here
    vis.sim = d3
      .forceSimulation(vis.dataAttributed, function (d) {
        return [d[0], vis.radiusScale(d[1])];
      })
      .force(
        "x",
        d3.forceX(vis.width / 2 + vis.maxCircleSize * 1.5).strength(0.01)
      )
      .force("y", d3.forceY(vis.height / 2).strength(0.01))
      .force(
        "center",
        d3
          .forceCenter()
          .x(vis.width * 0.5)
          .y(vis.height * 0.5)
          .strength(0.2)
      )
      .force("charge", d3.forceManyBody().strength(-5))
      .force(
        "collide",
        d3
          .forceCollide(function (d) {
            return vis.radiusScale(d[1]);
          })
          .iterations(2)
          .strength(1.0)
      )
      .on("tick", function () {
        vis.node
          .enter()
          .append("g")
          .merge(vis.node)
          .attr("transform", function (d) {
            let x = d.x;
            let y = d.y;
            let rad = vis.radiusScale(d[1]);

            //bounding box logic (stay within padding area of box)
            if (x > vis.width - vis.padding - rad) {
              x = vis.width - vis.padding - rad;
            } else if (x - vis.padding - rad < 0) {
              x = vis.padding + rad;
            }
            if (y > vis.height - vis.padding - rad) {
              y = vis.height - vis.padding - rad;
            } else if (y - vis.padding - rad < 0) {
              y = vis.padding + rad;
            }
            return `translate(${x},${y})`;
          })
          .call(
            d3
              .drag() // call specific function when circle is dragged
              .on("start", (d) => vis.dragStart(d, vis.sim))
              .on("drag", vis.drag)
              .on("end", (d) => vis.dragEnd(d, vis.sim))
          );

        vis.node.exit().remove();
        d3.selectAll(vis.circles).exit().remove();
      });
  }

  dragStart(d, sim) {
    // restart movement of sim
    sim.alphaTarget(0.3).restart();
  }

  drag(d) {
    // remove tooltip and allow bubble to move by mouse
    d3.select("#tooltip").style("display", "none");
    d.subject.x = d.x;
    d.subject.y = d.y;
  }

  dragEnd(d, sim) {
    // stop the bubbles from moving around after user is done
    sim.alphaTarget(0);
  }
}
