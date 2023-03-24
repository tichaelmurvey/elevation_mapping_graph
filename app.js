elevationButton = document.querySelector(".getElevation");
coordInput = document.querySelector(".coords");
scaleInput = document.querySelector(".scale");
pointinessInput = document.querySelector(".pointiness");
lodInput = document.querySelector(".lod");
placeSearchCoordInput = document.querySelector("#placesearch-coords");
placeSearchLocationInput = document.querySelector("#placesearch-location");
coordSearchCoordInput = document.querySelector("#coordsearch-coords");
coordSearchLocationInput = document.querySelector("#coordsearch-location");

//Chart.defaults.color = '#000';
Chart.defaults.elements.point.pointStyle = false;
Chart.defaults.elements.line.tension = 0.3;
Chart.defaults.elements.line.borderWidth = 1;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.color = '#FFF';
Chart.defaults.backgroundColor = '#000';

const canvasbackground = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const {ctx} = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.color || '#99ffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

let heightScale = 10;
let myChart;
let elevationGrid = [];

elevationButton.addEventListener("click", getElevationData);
document.querySelector(".loading").style.display = "none";
document.querySelector(".chartcontainer").style.display = "none";
document.querySelector(".error-message").style.display = "none";

async function getElevationData(){
  //Change display to loading
  document.querySelector(".error-message").style.display = "none";
  document.querySelector(".chartcontainer").style.display = "none";
  document.querySelector(".loading").style.display = "block";
  console.log("getting data");

  //Select appropriate input box
  

    //fetch(`https://topo-redirect.onrender.com/api/grid?originalcoords=${coordInput.value}&distance=${scaleInput.value*1000}&lod=${lodInput.value}`)
    fetch(`http://localhost:3000/api/grid?originalcoords=${coordInput.value}&distance=${scaleInput.value*1000}&lod=${lodInput.value}`)
    //fetch("https://opentopodata-server-pfdy7ufylq-uc.a.run.app/v1/test-dataset?locations=45.464519215734654,-73.66560713719198|45.464519215734654,-73.53731965791152&samples=100")
        .then((response) => response.json())
        .then((data) => updateGraph(data.results))
        .catch(err => {
          document.querySelector(".loading").style.display = "none";     
          document.querySelector(".error-message").style.display = "block";
        })

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
document.querySelector(".chartcontainer").style.display = "block";
document.querySelector(".loading").style.display = "none";
    buildChart(elevationGraphStaggered);
    console.log("updating chart");
 }

  function buildChart(data) {
      let title = locationInput.value.toUpperCase();
      if(myChart){
        myChart.destroy();
      }
      myChart = new Chart(
        document.getElementById('chart1'),
        {
          type: 'line',
          options: {
            events: [],
            scales: {
              x: {
                display: false
              },
              y: {
                display: false,
                position: 'center',
              }
            },        
            plugins: {
              customCanvasBackgroundColor: {
                color: '#000',
              },        
              title: {
                display: true,
                text: title,
                position: 'bottom',
                fullsize: false,
                font: {
                  size: getFontSize(title, document.querySelector(".chartcontainer").offsetWidth, 'TeXGyreHeros'),
                  family: "'TeXGyreHeros', sans-serif",
                  weight: 'normal'
              }
              }
            },
        
            responsive: true,        
            aspectRatio: 1,
            elements: {
            point: {
                pointstyle: false
            }
          }
        },
        plugins: [canvasbackground],
        data: {
            datasets: data.reverse().map(dataset => {
                return {
                    data: dataset, 
                    borderColor: '#FFF',
                    fill: {
                        target: 'origin',
                        above: 'rgb(0, 0, 0)'
                      }
                }
            }),
            labels: data[0].map((point, index) => {return index} )
          }
        }
      );
    }
    


    function getFontSize(text, targetWidth, font) { 
      console.log(text, targetWidth, font);
      var c = document.querySelector("canvas");
      var ctx = c.getContext("2d");
      var size = 1; 
      ctx.font = size + 'px ' + font; 
      while (ctx.measureText(text).width < targetWidth && size < 100) { 
        console.log(ctx.measureText(text).width);
        size++; 
        ctx.font = size + 'px ' + font; 
      } 
      return size; 
    }

    function downloadImage(){
      var link = document.createElement('a');
      link.download = `${locationInput.value}.png`;
      link.href = document.querySelector('canvas').toDataURL()
      link.click();
    }
    
    coordSearchCoordInput.onchange = function(){
      updateLocation();
    }

    scaleInput.onchange = function(){
      updateLocation();
    }

    placeSearchLocationInput.onchange = function(){
      updateCoords();
    }

    async function updateLocation(){
      let coords = coordSearchCoordInput.value.split(",")
      let locationData = await fetch(`https://geocode.maps.co/reverse?lat=${coords[0].trim()}&lon=${coords[1].trim()}`)
        .then((response) => response.json())
        .then(data => {return data})
      console.log(locationData);
      if(scaleInput.value < 10){
        console.log("hello world");
        coordSearchLocationInput.value = locationData.address.suburb;
      } else if(scaleInput.value < 100){
        coordSearchLocationInput.value = locationData.address.city;
      } else if(scaleInput.value < 1000){
        coordSearchLocationInput.value = locationData.address.state;
      } else {
        coordSearchLocationInput.value = locationData.address.country;
      }
    }

    async function updateCoords(){
      let location = placeSearchLocationInput.value;
      let locationData = await fetch(`https://geocode.maps.co/search?q=${location}`)
        .then((response) => response.json())
        .then( data => {return data[0]})
        console.log(locationData)
      placeSearchCoordInput.value = `${locationData.lat},${locationData.lon}`
    }