let data, scatterPlot, barChart, lexisChart, countries;
let genderFilter = [];
let scatterFilter = [];
let lastSelected;

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/leaderlist.csv').then(_data => {
  data = _data;
  // Convert columns to numerical values
  data.forEach(d => {
    Object.keys(d).forEach(attr => {
      if (attr == 'pcgdp') {
        d[attr] = (d[attr] == 'NA') ? null : +d[attr];
      } else if (attr != 'country' && attr != 'leader' && attr != 'gender') {
        d[attr] = +d[attr];
      }
    });
  });

  data.sort((a,b) => a.label - b.label);

  //init default label
  countries = "oecd";

  //Initialize Views
  lexisChart = new LexisChart({
    parentElement: '#lexischart',
  }, data);

    barChart = new BarChart({
        parentElement: '#barchart',
    }, data);

    scatterPlot = new ScatterPlot({
        parentElement: '#scatterplot',
    }, data);



  //filter initial data
  filterData();

  //Todo: Listen to events and update views

  d3.select('#country-selector').on('change', function() {
    countries = d3.select(this).property('value');
    filterData();
  });

});

function filterData(sourceView) {

    //filter for country selection
    let countryFiltered = data.filter((d) => {
      return d[countries] === 1;
    });

    let lexisFiltered = countryFiltered;

    //filter for gender
    if (genderFilter.length !== 0) {
        countryFiltered.forEach(
            d => {
                    if(genderFilter.includes(d.gender)){
                         d.opaque = 1;
                    } else {
                        d.opaque = 0;
                    }
            });
        //filter for lexis chart
        lexisFiltered = countryFiltered.filter(d => genderFilter.includes(d.gender));

    } else {
        countryFiltered.forEach(
            d => {
                d.opaque = 1;
            });
    }


    if(scatterFilter.length !== 0){
        lexisFiltered.forEach(
            d => {
                if(lastSelected === d.id){
                    d.label = 0;
                    d.selected = 0;
                }
                if(scatterFilter.includes(d.id)){
                    d.label = 1;
                    d.selected = 1;

                }
            });
        lastSelected = scatterFilter[0];


    } else {
        lexisFiltered.forEach(
            d => {
                if(lastSelected === d.id){
                    d.label = 0;
                    d.selected = 0;

                }
            });
    }

    lexisChart.data = lexisFiltered;
    barChart.data = countryFiltered;
    scatterPlot.data = countryFiltered;

    if(sourceView === "scatter") {
        lexisChart.updateVis();
        scatterPlot.updateVis();
    } else {
        lexisChart.updateVis();
        barChart.updateVis();
        scatterPlot.updateVis();
    }
}


/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */


