elevationButton = document.querySelector(".getElevation");
coordInput = document.querySelector(".coords");
scaleInput = document.querySelector(".scale");
pointinessInput = document.querySelector(".pointiness");
lodInput = document.querySelector(".lod");
placenameField = document.querySelector(".placename");
locationInput = document.querySelector(".location");

let heightScale = 10;
let myChart;
let elevationGrid = [];

elevationButton.addEventListener("click", getElevationData);
document.querySelector(".loading").style.display = "none";

async function getElevationData(){
    document.querySelector("#chart1").style.display = "none";
    document.querySelector(".loading").style.display = "block";
    console.log("getting data");
    //fetch(`https://topo-redirect.onrender.com/api/grid?originalcoords=${coordInput.value}&distance=${scaleInput.value*1000}&lod=${lodInput.value}`)
    fetch(`http://localhost:3000/api/grid?originalcoords=${coordInput.value}&distance=${scaleInput.value*1000}&lod=${lodInput.value}`)
    //fetch("https://opentopodata-server-pfdy7ufylq-uc.a.run.app/v1/test-dataset?locations=45.464519215734654,-73.66560713719198|45.464519215734654,-73.53731965791152&samples=100")
        .then((response) => response.json())
        .then((data) => updateGraph(data.results));
}

function updateGraph(elevationGrid){
    let distance = scaleInput.value*1000;
    let numPoints = lodInput.value;
    let lineOffset = distance/numPoints; //Distance between intervals for the purpose of graphing

    console.log("data ", elevationGrid);
    let elevationGraphData = structuredClone(elevationGrid);
    elevationGraphData = elevationGrid.map(line => {
        //return line.results;s
        return line.results.map(point => {
            return point.elevation;
            //return 12;
        })
     })
     console.log("elevation grid ", elevationGraphData);

     lowestPoint = 100000;
     highestPoint = 0;
     elevationGraphData.forEach((line, index) => { 
        line.forEach((value, index2) => {
            if(line[index2] > highestPoint){highestPoint = line[index2]}
            if(line[index2] < lowestPoint){lowestPoint = line[index2]}
        })
     })
     console.log("Lowest point: " + lowestPoint);
     console.log("Highest point: " + highestPoint);
     let locationSteepness = highestPoint - lowestPoint; 
     //Set height modification so that the percentage of space occupied matches the steepness
     let percentageMountain = (pointinessInput.value/2.5)/10;
     heightScale = (percentageMountain*distance)/locationSteepness
     //lineOffset = lineOffset*heightScale;
     //Scale the elevation from the base point (lowest)
     let elevationGraphScaled = elevationGraphData.map(line => {
        return line.map(point =>{
            //Set the lowest point to 0 and all others relative
            let newPoint = point - lowestPoint;
            //Add scaling factor multiplier
            newPoint = newPoint*heightScale;
            //Add total graph height
            newPoint += numPoints*lineOffset;
            return newPoint;
        })
     })
     console.log(elevationGraphScaled);

    //Add the offset to stagger lines
    let elevationGraphStaggered = elevationGraphScaled.map((line, lineIndex) => {
        return line.map(point => {
            return point - lineOffset*lineIndex;
        })
    })
    console.log("staggered", elevationGraphStaggered)
// Initialize a Line chart in the container with the ID chart
    console.log("updating chart");
    myChart = new Chartist.Line('#chart1', {
    series: elevationGraphStaggered
        },{
    fullWidth: false,
    showPoint: false,
    low: 0,
    high: numPoints*lineOffset+highestPoint*heightScale,
    showArea: true,
    axisX: {
        showGrid: false,
        showLabel: true
      },
      axisY: {
        showGrid: false,
        showLabel: true
      }
  });
  document.querySelector("#chart1").style.display = "block";
  document.querySelector(".loading").style.display = "none";
  placenameField.textContent = locationInput.value;
 }

 function downloadSVG() {
    const svg = document.getElementById('container').innerHTML;
    const blob = new Blob([svg.toString()]);
    const element = document.createElement("a");
    element.download = "w3c.svg";
    element.href = window.URL.createObjectURL(blob);
    element.click();
    element.remove();
  }