# CPSC 436V Project

### Index.html: </br>
In this file, we have our main page where the control panel HTML elements are defined and the div anchor points for our visualization elements defined in JavaScript are placed.
Style.css
In this file, all of our styling for the visualization is defined here. There will be more in-depth styling and the M3 checkpoint that focuses on the interactive feedback of the visualization.

### Data-process.py: </br>
This script takes two source CSV files and uses NumPy and pandas to clean and filter their data before performing an inner join on the NTSB report number and then saves a new CSV. The rationale and further explanation can be found in the write-up section of M2.

### Main.js: </br>
This is the main entry point of the JavaScript part of the visualization. Here we load our data and set the initial state of our interactivity and control panel. After the data is loaded, we set up our visualizations and perform some minimal data formatting such as setting strings back to numbers for appropriate attributes and parse the dates correctly. We also set up the dispatchers and on-click callbacks for the control panel interactive elements here.
controlBoxFilter()  is a function in main that is run to refilter the data for the visualizations based on the given program state that is controlled by the control box interactive elements. We perform filtering based on the checkboxes, the date, and the dropdown selector. Afterward, the visualizations that rely on this data are updated accordingly.

### Controls.js: </br>
This file is used to render the date selector in the control panel. This class follows a similar structure to the assignments with the init, update, and render method pattern to render a brushable region over top of a histogram to select the desired date region. The brush region selected is then rounded to the nearest year so that when the dispatcher is called the other views don’t each have to process the selection region.

### Overview.js: </br>
Inspired by: https://archive.nytimes.com/www.nytimes.com/interactive/2012/09/06/us/politics/convention-word-counts.html#!
In this file, the overview bubble chart is defined. This file also follows the init, update, and render structure. We use SVG groups here to enclose the text and circle elements for the bubbles that have their size chosen by a square root scale. The data in this class are grouped by make and then a value is generated based on the control panel selector in the form: [aircraft maker name, value] which is then easily ordered, and the top 50 highest values are chosen to be selected on the bubble chart. The data filtering follows a pattern of selecting the required columns of the data with a map operation and then if needed summing the examples and filtering out invalid entries if needed (such as divisions by zero).  For the rendered component a d3 force simulation was used to translate the circles around with a balance of forces to keep the bubbles from sticking to the outside region and enough to prevent circle to circle overlap. An additional constraint on the location of the bubbles was made to avoid them going off-screen which took into account their radius to ensure the effect was consistent. Some basic on-drag events were made so the user could move the circles around to better compare the size between two circles of interest,



### phases.js </br>

The curve chart of flight phases is being drawn under this file following the tutorial from https://github.com/d3/d3-shape#curveBasis. After manually initiating the x,y points of the curve, I used d3.curveBasis() under d3.line() to allow a more smooth curve instead of edgy/sharp connection of the paths for the curve.

To allow animation of the plane movement along the curve, I followed http://bl.ocks.org/KoGor/8163268 to use transition(), duration(time) and an animation function helper called translateAlong(path). Right now, the plane just moves along the path without stopping passing through all the flight phase stops, but in the future (i.e. next milestone), we would be adding scrolling controls to allow interaction between the plane and the path.

I have also used this tutorial to load image files in d3 using<br>

        .attr("xlink:href", "image-path")

Pie charts are essentially an arc path. Following tutorials https://www.d3-graph-gallery.com/pie, I used vis.pie.value(d => d.value)
to get the position of each group on the pie slices using the number of accident between commercial and personal flights.
For the plane icon, need to reference for later:


        <a target="_blank" href="https://icons8.com/icons/set/fighter-jet">Fighter Jet icon</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>



### usMap.js (Hex Bin Map) </br>

1.  I first figured out how to draw a blank map with states using a projection.  I made one with counties, but then had to use different data files to render states instead (found in us.json).
2.  After drawing the base map, I drew dots on the map, running them through the projection.
3.  The map was too populated, so I drew hex bins on the map using a d3 library.  These hex bins were automatically size scaled based on the total incidents in the area.
4.  I added an orange to red interpolated color scale to the hex bins based on the total fatal injuries in the bin.
5.  I colored the map background black to contrast the hex bins.


Used as reference to make hex chart in the map view:<br>
https://observablehq.com/@d3/hexbin-map


Used to draw base map:<br>
http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922


I first looked over the code and familiarized myself with the different classes and views. Then I read the expectations in assignment.md and followed them in order. I will split my process into the 4 different js files to explain it clearer:


### stackedBarChart.js </br>

1. I created the Y axis for the bar chart with linear scales for the number of incidents from 0 to 70,000.
2. I grouped the data by flight purpose.
3. I created stacks based on injury severity using d3.stack
4. I color coded the stacks based on injury severity.
5.  I placed the bar chart below the flight phase unique view in the index.html

Used as reference to make stacked rectangles in the bar chart:
https://github.com/UBC-InfoVis/2021-436V-examples/tree/master/d3-stacked-bar-chart
 
