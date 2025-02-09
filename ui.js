// =========================== IMPORTS ================================== //
var main = require('users/sarwanshah1996/SES598-RemoteSensing:FM_Main');
var map = ui.Map();


// Load FAO/GAUL dataset for countries and states
var countries = ee.FeatureCollection("FAO/GAUL/2015/level0");
var states = ee.FeatureCollection("FAO/GAUL/2015/level1");

// Extract country names
var countryNames = countries.aggregate_array("ADM0_NAME").distinct().sort();

// Extract state names for each country
var statesByCountry = {};
countryNames.evaluate(function(countryNamesList) {
  countryNamesList.forEach(function(countryName) {
    var countryStates = states.filter(ee.Filter.eq("ADM0_NAME", countryName)).aggregate_array("ADM1_NAME").distinct();
    statesByCountry[countryName] = countryStates;
  });
});

// Define dropdown menus for country and state
var countryInput = ui.Select({
  
  items: countryNames.getInfo(),
  placeholder: 'Select country'
});

var stateInput = ui.Select({
  placeholder: 'Select state'
});

// Handle country selection
countryInput.onChange(function(country) {
  var countryStates = statesByCountry[country];
  stateInput.items().reset(countryStates.getInfo());
  stateInput.setPlaceholder('Select state');
});


var beforeFloodStartInput = ui.Panel([
  ui.Label('Before Flood Start'),
  ui.DateSlider({
    start: '2000-01-01',
    value: '2022-05-15'
  })
]);

var beforeFloodEndInput = ui.Panel([
  ui.Label('Before Flood End'),
  ui.DateSlider({
    start: '2000-01-01',
    value: '2022-07-15'
  })
]);

var afterFloodStartInput = ui.Panel([
  ui.Label('After Flood Start'),
  ui.DateSlider({
    start: '2000-01-01',
    value: '2022-07-15'
  })
]);

var afterFloodEndInput = ui.Panel([
  ui.Label('After Flood End'),
  ui.DateSlider({
    start: '2000-01-01',
    value: '2022-09-15'
  })
])

var scaleInput = ui.Textbox('Scale', '500');
var tileScaleInput = ui.Textbox('Tile Scale', '8');

// Define run button
var runButton = ui.Button({
  label: 'Run Analysis',
  onClick: function() {
    main.runAnalysis(
      countryInput.getValue(), 
      stateInput.getValue(),
      new Date(beforeFloodStartInput.widgets().get(1).getValue()[0]).toISOString().split('T')[0], 
      new Date(beforeFloodEndInput.widgets().get(1).getValue()[0]).toISOString().split('T')[0], 
      new Date(afterFloodStartInput.widgets().get(1).getValue()[0]).toISOString().split('T')[0], 
      new Date(afterFloodEndInput.widgets().get(1).getValue()[0]).toISOString().split('T')[0], 
      parseInt(scaleInput.getValue()), 
      parseInt(tileScaleInput.getValue()),
      map
    );
  }
});


// Define dropdown menus for country and state
var countryInputPanel = ui.Panel([
  ui.Label('Country'), // Add a label for country input
  countryInput
]);

var stateInputPanel = ui.Panel([
  ui.Label('State'), // Add a label for state input
  stateInput
]);

var scaleInputPanel = ui.Panel([
  ui.Label('Scale'), // Add a label for scale input
  scaleInput
]);

var tileScaleInputPanel = ui.Panel([
  ui.Label('Tile Scale'), // Add a label for tile scale input
  tileScaleInput
]);


// Define the panel layout with center-aligned elements
var inputsPanel = ui.Panel({
  widgets: [
    countryInputPanel,
    stateInputPanel,
    beforeFloodStartInput,
    beforeFloodEndInput,
    afterFloodStartInput,
    afterFloodEndInput,
    scaleInputPanel,
    tileScaleInputPanel,
    runButton
  ],
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    width: '280px',
    backgroundColor: 'lightgrey', // Center-align the elements
    textAlign: 'center',
    padding: '30px',
    border: '10px',
  }
});


// Add the panel to the map
ui.root.widgets().reset([inputsPanel, map]);


// Define a dictionary which will be used to make legend and visualize image on map
var dict = {
  "names": [
    "Flooded Land",
    "Flooded Crop Land",
    "Flooded Urban Land",
    "Permanant Water",
    "Crop Land",
    "Urban Land",
    "State Bounds",
    "Country Bounds",
  ],
  "colors":[
    "#ED022A",
    "#FFA500",
    "#800080",
    "#1A5BAB",
    "#F2FAFF",
    "#C8C8C8",
    "#A7D282",
    "#C8C8C8",
  ],
  };

// Create a panel to hold the legend widget
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'Legend',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);

var loading = ui.Label('Loading legend...', {margin: '2px 0 4px 0'});
legend.add(loading);

// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}; 

// Get the list of palette colors and class names from the image.
var palette = dict['colors'];
var names = dict['names'];
loading.style().set('shown', false);

for (var i = 0; i < names.length; i++) {
  legend.add(makeRow(palette[i], names[i]));
}

map.add(legend);

// ======================



