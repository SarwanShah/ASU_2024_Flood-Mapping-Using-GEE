# 🌊 Flood Mapping and Impact Assessment Using Google Earth Engine  

## 📌 **Project Overview**  
This project was developed as part of the **SES 598 Cloud-Based Remote Sensing** course at **Habib University**, led by **Instructor Jiwei Li**. It leverages **Google Earth Engine (GEE)** to map flood events and assess their impacts on urban and agricultural land. Using satellite data from **Sentinel-1 SAR** and **MODIS**, the application enables near-real-time flood detection and impact analysis, empowering decision-makers in flood-prone areas to take informed actions.

**REPORT**: [Final_Report.pdf](Final_Report.pdf)  
**PRESENTATION**: [Final_Presentation.pptx](Final_Presentation.pptx)  

---

## 🌍 **Project Motivation**  
The frequency of extreme weather events, such as flooding, has increased due to climate change. A striking example was the **2022 Pakistan floods**, which submerged one-third of the Sindh province. This project aims to provide a scalable solution to quickly map and assess flood impacts, helping communities prepare and respond to future events.  

---

## 🛠 **Project Features**  
- **Flood Mapping**:
  - Utilizes **Sentinel-1 SAR** (Synthetic Aperture Radar) data with high spatial resolution (10m), capable of capturing flood events even under cloud cover.
  - Supports before-and-after analysis using user-defined date ranges.

- **Impact Assessment**:
  - Integrates **MODIS** land cover data to analyze flood effects on urban and crop land.
  - Generates statistics such as total flooded area and percentage of affected regions.

- **Speckle Noise Reduction**:
  - Applies a **Refined Lee Speckle Filter** to enhance image clarity by reducing radar noise.

- **User-Friendly Interface**:
  - Dynamic input panels for region selection, date inputs, and analysis parameters.
  - Customizable thresholds for flood and terrain filtering.

- **Visualization and Outputs**:
  - Displays flood extent, impacted urban/crop areas, and a detailed legend.
  - Outputs key statistics for decision-making.

---

## 🔧 **How It Works**  
1. **Select Region**: Choose a country and state using administrative boundaries from the FAO GAUL dataset.  
2. **Define Timeframes**: Specify "before" and "after" flood event date windows.  
3. **Run Analysis**: The app processes Sentinel-1 and MODIS satellite data to detect flooded regions.  
4. **View Results**: Visual maps and statistical outputs appear on the interface, highlighting affected areas.  

---

## 🛰 **Datasets Used**  
| Dataset              | Description                                  | Resolution  | Source               |
|----------------------|----------------------------------------------|-------------|----------------------|
| Sentinel-1           | C-band SAR for flood detection               | 10m         | ESA Copernicus       |
| MODIS                | Land cover data for impact assessment        | 500m        | NASA EOSDIS          |
| Global Surface Water | Seasonal water body data                     | Various     | European Commission  |
| HydroSHEDS           | Elevation model for slope filtering          | 3 arc-seconds | WWF                 |

---

## 🏗 **Code Structure**  
| File                 | Description                                  |
|----------------------|----------------------------------------------|
| `main.js`            | Core analysis and flood mapping logic        |
| `ui.js`              | User interface code                          |
| `fetchregion.js`     | Fetches regional boundaries from FAO GAUL    |
| `specklefilter.js`   | Implements speckle noise reduction           |

---

## ⚠ **Design Challenges & Future Work**  
- **Asynchronous Data Processing**: Managing Google Earth Engine's asynchronous tasks within a user interface posed challenges.  
- **Edge Case Testing**: Improving the robustness of flood detection in varying geographical and climatic conditions is ongoing.  
- **Enhanced Parameter Control**: Future versions aim to offer more dynamic user-defined parameters and visualization features.  

---

## 💰 **Cost Efficiency**  
As a cloud-based solution utilizing open-access satellite data, this project incurs minimal operational costs while offering scalability and global applicability.

---

## 📥 **How to Use**  
1. Install **Google Earth Engine** and ensure access to relevant datasets.  
2. Clone this repository.  
3. Run the app through GEE's code editor by uploading the provided scripts (`main.js`, `ui.js`, etc.).  
4. Follow on-screen prompts to configure and execute the flood analysis.  

---

## 📜 **License**  
This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

🎉 **Thank you for exploring our project!**
