// =========================== IMPORTS ================================== //

var speckleFilter = require('users/sarwanshah1996/SES598-RemoteSensing:FM_SpeckleFilter');
var region = require('users/sarwanshah1996/SES598-RemoteSensing:FM_FetchRegion');

exports.runAnalysis = function(country, state, 
                               beforeStart, beforeEnd,
                               afterStart, afterEnd,
                               scale, tileScale, Map) {
                                 
                               
// =========================== DEFINING THE REGION ================================== //
// ============================= AND TIMEFRAME ================================= //


// Call the function and retrieve the boundaries
var boundaries = region.getBoundaries(country, state);
var countryBoundary = boundaries.countryBoundary;
var stateBoundary = boundaries.stateBoundary;

Map.addLayer(countryBoundary, {color: 'grey', fillOpacity: 0, outlineOpacity: 1}, 'Country Boundary');
Map.addLayer(stateBoundary, {color: 'lightgreen', fillOpacity: 0, outlineOpacity: 1}, 'State Boundary');
Map.centerObject(stateBoundary, 7); // Center the map on the state boundary

var roi = stateBoundary;
var beforeFloodStart = beforeStart;
var beforeFloodEnd = beforeEnd;
var afterFloodStart = afterStart;
var afterFloodEnd = afterEnd;
var dateMODIS = beforeFloodStart.slice(0,4) + '_01_01';

// =========================== IMPORTING REQUIRED DATASETS ================================== //

// Dataset from the joint research center (JRC) of the European
// commission that has information about the presence, change,
// seasonability of water bodies on the earth's surface. We make
// use of this to identify what are existing water bodies and 
// their seasonal variation against what is an abnormal presence of 
// whatever bodies. Meanwhile the hydrosheds datasets allows us to see
// terrain with slope, allowing to eliminate locations where flood water 
// cannot stand.
var gsw = ee.Image("JRC/GSW1_2/GlobalSurfaceWater").clip(roi);
var hydrosheds = ee.Image("WWF/HydroSHEDS/03VFDEM").clip(roi);

// This MODIS based dataset provides information on urban and crop
// land cover distribution that will help us access the impact of 
// the flood in terms of its affect on urban and rural populations.
var landCover = ee.Image('MODIS/061/MCD12Q1/' + '2022_01_01').clip(roi)
                        .select('LC_Type1');

// Fetching sentinel-1 (C-band Synthetic Aperture Radar Ground Range Detected)
// SAR GRD data. This data is based on a microwaves and can penetrated clouds.
// It has a spatial resolution of 10m and a temporal resolution of 10 - 12 days
// over south asia. 

// It captures data while ascending and descending in orbit across a certain location
// and the data is sensed in two polarization modes, vertical (V) and horizontal (H).
// This enabled four bands: HH, HV, VV, VH

//Additionally. the sensor captures data in 3 modes:
// 1. Interferometric Width Swath (IW) --> Most commonly used
// 2. Extra Wide Swath (EW) --> low resolution, much larger area
// 3. Strip-map (SM) --> high resolution, smaller area

// GEE already performs pre-processing on sentinel 1 data for 
// noise removel and radiometric calibration
var sentinel = ee.ImageCollection('COPERNICUS/S1_GRD')
              .filter(ee.Filter.eq('instrumentMode','IW')) 
              .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
              .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
              .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING')) 
              .filter(ee.Filter.eq('resolution_meters',10))
              .filterBounds(roi)
              .select(['VH', 'VV'])
              
              
var addRatioBand = function(image) {
  var ratioBand = image.select('VV').divide(image.select('VH')).rename('VV/VH');
  return image.addBands(ratioBand)
}
              
// =========================== DRAWING OUT/MAPPING THE FLOOD ================================== //
              
// Gathering images from before the flood and after it 
var beforeFloodImages = sentinel.filterDate(beforeFloodStart, beforeFloodEnd)
var afterFloodImages = sentinel.filterDate(afterFloodStart, afterFloodEnd)

// In optical data when we want an image from a collection
// we use the median reducer instead of a mean value, because
// presence of clouds and shadows can throw off the mean-value
// but since sentinel data is not effected by clouds, we can take the mean
// or alternatively, mosaic it without having to apply any filtering for clouds
var beforeFlood = beforeFloodImages.mosaic().clip(roi);
var afterFlood = afterFloodImages.mosaic().clip(roi);

beforeFlood = addRatioBand(beforeFlood);
afterFlood = addRatioBand(afterFlood);

// The sentinel-1 radar data inherently suffers from grainy noise
// that reduces the quality of features that can derived from the data
// and can result in misleading features as well. A refined lee speckle filter is
// thus applied to image collections, which is an industry standard to 
// address this issue. Note: the return images are in decibels

var beforeFloodFiltered = speckleFilter.apply(beforeFlood);
var afterFloodFiltered = speckleFilter.apply(afterFlood);


// Taking the difference between the before flood and
// after flood images by dividing them since they are in decibels.
// Division is suitable because many changes in SAR images are of
// multiplicative nature, and division captures that difference, in-addition
// to having the effect of normalization. Results in a single band image.
var difference = afterFloodFiltered.divide(beforeFloodFiltered);


var floodThres = 1.05;
var flooded = difference.gt(floodThres).rename('floodwater').selfMask();

// Using the global surface water dataset to identify & remove
// permenant/semi-perm surface water from the scene based 
// on seasonality. Seasonality band ranges from 0 (never has water)
//  to 12 (if has water all 12 months)
var permWater = gsw.select('seasonality').gte(6)
var flooded = flooded.where(permWater, 0).selfMask()
Map.addLayer(permWater.selfMask(), {min:0, max:1, palette: ['blue']}, 'Permanent Water')

// Similarly, using the HydroSHEDS DEM dataset we identify
// and remove areas that have a slope of greater than 10m
// as we would not expect flood water to hold along such slopes
var slopeThres = 10;
var slope = ee.Algorithms.Terrain(hydrosheds).select('slope');
var flooded = flooded.updateMask(slope.lt(slopeThres));
var slopedTerrain = slope.gte(slopeThres).selfMask()

// Remove isolated pixels that maybe just noise or
// very small water bodies
var isolationThres = 4;
var connections = flooded.connectedPixelCount(25)
var flooded = flooded.updateMask(connections.gt(isolationThres))
var noisyTerrain = connections.lte(isolationThres).selfMask()


// =========================== DRAWING OUT/MAPPING URBAN AND CROP LAND ================================== //

// Filter urban (13) and cropland (12) classes
var urbanLand = landCover.eq(13);
var cropLand =  landCover.eq(12).or(landCover.eq(14));

var urbanCropLand = cropLand.where(urbanLand, 2);
urbanCropLand = urbanCropLand.updateMask(urbanCropLand.neq(0));

var urbanCropLandVis = {
  min: 1, // No urban/crop land (black)
  max: 2, // Urban/crop land (white)
  palette: ['white', 'grey'], // Black for non-urban/crop land, white for urban/crop land
};

Map.addLayer(urbanCropLand, urbanCropLandVis, 'Urban and Crop Land', true, 0.75);


// FINAL FLOOD MAP
Map.addLayer(flooded, {min:0, max:1, palette: ['red']}, 'Flooded Land');


// =================== IDENTIFYING URBAN AND LAND COVER EFFECTED BY FLOOD =====================//

// Masking the urban and crop land cover layers with the flooded area
var floodedUrbanMasked = flooded.updateMask(urbanLand);
var floodedCropMasked = flooded.updateMask(cropLand);

// Visualize the affected urban and crop land
Map.addLayer(floodedUrbanMasked, {min:0, max:1, palette: ['purple']}, 'Flooded Urban Land', true, 0.5);
Map.addLayer(floodedCropMasked, {min:0, max:1, palette: ['orange']}, 'Flooded Crop Land', true, 0.5);

// ==================== PERFORMING STATISTICAL ANALYSIS ON DATA ============================= //

// Calculate Affected Area
var stats = flooded.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: scale,
  maxPixels: 1e10,
  tileScale: tileScale
});

var totalArea = roi.geometry().area().divide(10000);
var floodedArea = ee.Number(stats.get('floodwater')).divide(10000);
var percFloodedArea = ee.Number(100).multiply(
  floodedArea.divide(totalArea)
);

// Calculate the area of cropland and urban land
var areaCropLand = urbanCropLand.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: scale,
  maxPixels: 1e12,
  tileScale: tileScale
});

var areaUrbanLand = urbanLand.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: scale,
  maxPixels: 1e12,
  tileScale: tileScale
});

// Convert area to hectares
var areaCropLandHectares = ee.Number(areaCropLand.get('LC_Type1')).divide(10000);
var areaUrbanLandHectares = ee.Number(areaUrbanLand.get('LC_Type1')).divide(10000);

// Calculate the affected area of urban and crop land
var statsUrban = floodedUrbanMasked.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: scale,
  maxPixels: 1e10,
  tileScale: tileScale
});

var statsCrop = floodedCropMasked.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: scale,
  maxPixels: 1e10,
  tileScale: tileScale
});

// Convert area to hectares
var totalUrbanCropArea = areaCropLandHectares.add(areaUrbanLandHectares);
var floodedUrbanArea = ee.Number(statsUrban.get('floodwater')).divide(10000);
var floodedCropArea = ee.Number(statsCrop.get('floodwater')).divide(10000);
var totalFloodedUrbanCropArea = floodedUrbanArea.add(floodedCropArea);
var percEffectedArea = ee.Number(100).multiply(
  totalFloodedUrbanCropArea.divide(totalUrbanCropArea)
);

// Create an empty ee.List to store stats and values
var statsList = ee.List(['Total state area (ha)', 'Flooded area (ha)', '% Flooded area (%)']);
var valuesList = ee.List([totalArea.format('%.3f'), floodedArea.format('%.3f'), percFloodedArea.format('%.3f')]);

// Add statistics and values to the lists
statsList = statsList.add('Crop land area (ha)');
valuesList = valuesList.add(areaCropLandHectares.format('%.3f'));

statsList = statsList.add('Urban land area (ha)');
valuesList = valuesList.add(areaUrbanLandHectares.format('%.3f'));

statsList = statsList.add('Flood affected urban area (ha)');
valuesList = valuesList.add(floodedUrbanArea.format('%.3f'));

statsList = statsList.add('Flood affected crop area (ha)');
valuesList = valuesList.add(floodedCropArea.format('%.3f'));

statsList = statsList.add('% Flood affected urban+crop area (%)');
valuesList = valuesList.add(percEffectedArea.format('%.3f'));

// Create a dictionary from lists
var dict = ee.Dictionary({
  stats: statsList,
  values: valuesList
});


var statsPanel = ui.Panel({
  style: {
    position: 'top-right',
    padding: '8px 15px'
  }
});

// Define the function to create a row in the statsPanel
var makeRow = function(stat, val) {
  // Create the label filled with the description text.
  var description = ui.Label({
    value: stat + ": " + val,
    style: {margin: '0 0 4px 6px'}
  });
  
  // Return a panel containing the description label
  return ui.Panel({
    widgets: [description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}; 

// Define a function to update the statsPanel with statistics from the dictionary
var updateStatsPanel = function(dict) {
  // Clear existing widgets from the statsPanel
  statsPanel.clear();
  
  // Add the legend title
  var statsTitle = ui.Label({
    value: 'Statistics',
    style: {
      fontWeight: 'bold',
      fontSize: '12px',
      margin: '0 0 4px 0',
      padding: '0'
    }
  });
  statsPanel.add(statsTitle);
  
  // Get the lists of statistics and values from the dictionary
  var statsList = dict.get('stats').getInfo();
  var valuesList = dict.get('values').getInfo();
  
  // Create UI elements for each statistic and value pair
  for (var i = 0; i < statsList.length; i++) {
    var stat = statsList[i];
    var val = valuesList[i];
    var row = makeRow(stat, val);
    statsPanel.add(row);
  }
  
  // Update the statsPanel on the UI
  Map.widgets().remove(statsPanel); // Remove existing statsPanel from the map
  Map.add(statsPanel); // Add updated statsPanel to the map
};

// Call the updateStatsPanel function to initially display the statistics
updateStatsPanel(dict);




}