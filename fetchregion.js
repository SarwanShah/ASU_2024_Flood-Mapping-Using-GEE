

exports.getBoundaries = function(country, state) {
    // Dataset from the Food and Agriculture Organization (FOA)
    // of the United Nations, which provides us with global boundaries
    // on a country (level 0) and state (level 1) level.
    var countries = ee.FeatureCollection("FAO/GAUL/2015/level0");
    var states = ee.FeatureCollection("FAO/GAUL/2015/level1");
    
    // Filter by country & state
    var countryBoundary = countries.filter(ee.Filter.eq('ADM0_NAME', country));
    var stateBoundary = states.filter(ee.Filter.and(
      ee.Filter.eq('ADM0_NAME', country),
      ee.Filter.eq('ADM1_NAME', state)
    ));
    
    return { countryBoundary: countryBoundary, stateBoundary: stateBoundary };
  }