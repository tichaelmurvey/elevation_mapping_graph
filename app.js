let elevationButton = document.querySelectorAll(".getElevation");
let pointinessInput = document.querySelector(".pointiness");
let lodInput = document.querySelector(".lod");
let placeSearchCoordInput = document.querySelector("#placesearch-coords");
let placeSearchLocationInput = document.querySelector("#placesearch-location");
let placeScaleInput = document.querySelector("#placesearch-scale")
let coordSearchCoordInput = document.querySelector("#coordsearch-coords");
let coordSearchLocationInput = document.querySelector("#coordsearch-location");
let coordScaleInput = document.querySelector("#coordsearch-scale");
let presetInput = document.querySelector("#presets");
let activeTab;
//let source = "https://topo-redirect.onrender.com/api/grid";
let source = "http://localhost:3000/proxy";

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

document.querySelector(".loading").style.display = "none";
document.querySelector(".chartcontainer").style.display = "none";
document.querySelector(".error-message").style.display = "none";

async function getElevationData(evt){
  //Change display to loading
  document.querySelector(".error-message").style.display = "none";
  document.querySelector(".chartcontainer").style.display = "none";
  document.querySelector(".loading").style.display = "block";
  console.log("getting data");

  //Select appropriate input box
  let coordInput, placeInput, distance;
  if(activeTab === "preset"){
    //set coordinput, placeinput, and distance to match the values from the relevant preset object
    let preset = presetInput.value;
    let presetObj = presets.find(presetObj => presetObj.id == preset);
    coordInput = presetObj.coords;
    placeInput = presetObj.name;
    distance = presetObj.scale*1000;
  } else if(activeTab === "placename"){
    coordInput = placeSearchCoordInput.value;
    placeInput = placeSearchLocationInput.value;
    distance = placeScaleInput.value*1000;
  } else if(activeTab === "coords"){
    coordInput = coordSearchCoordInput.value;
    placeInput = coordSearchLocationInput.value;
    distance = coordScaleInput.value*1000;
  }
  console.log("coordinput", coordInput);
  console.log("placeinput", placeInput);
  console.log("distance", distance);
  console.log("lod", lodInput.value);	
    //fetch(`https://topo-redirect.onrender.com/api/grid?originalcoords=${coordInput.value}&distance=${scaleInput.value*1000}&lod=${lodInput.value}`)
    fetch(`${source}?coords=${coordInput}&distance=${distance}&lod=${lodInput.value}`)
    //fetch("https://opentopodata-server-pfdy7ufylq-uc.a.run.app/v1/test-dataset?locations=45.464519215734654,-73.66560713719198|45.464519215734654,-73.53731965791152&samples=100")
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          return data;
        })
        .then((data) => updateGraph(data, distance, placeInput))
        .catch(err => {
          document.querySelector(".loading").style.display = "none";     
          document.querySelector(".error-message").style.display = "block";
          console.log(err);
        })

}

function updateGraph(elevationGrid, distance, placeName){
    let numPoints = lodInput.value;
    let lineOffset = distance/numPoints; //Distance between intervals for the purpose of graphing

    console.log("data ", elevationGrid);
    let elevationGraphData = structuredClone(elevationGrid);
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
     let heightRange = highestPoint - lowestPoint; 
     //Set height modification so that the percentage of space occupied matches the steepness where 1 is 5% and 10 is 50%
     let percentageMountain = pointinessInput.value*0.05
     heightScale = (percentageMountain*distance)/heightRange
     console.log("heightscale", heightScale);
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
     console.log("scaled", elevationGraphScaled);

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
    buildChart(elevationGraphStaggered, placeName);
    console.log("updating chart");
 }

  function buildChart(data, placeName) {
      let title = placeName.toUpperCase();
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
      link.download = `${document.querySelector(".location").value}.png`;
      link.href = document.querySelector('canvas').toDataURL()
      link.click();
    }
    document.getElementById("defaultOpen").click();

  elevationButton.forEach((item) => {
    item.addEventListener('click', getElevationData)
  });
    
    coordSearchCoordInput.onchange = function(){
      updateLocation();
    }

    coordScaleInput.onchange = function(){
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
      let boxsize = Math.round(Math.abs(locationData.boundingbox[0] - locationData.boundingbox[1])*111)
      if(boxsize > 1){
        document.querySelector(".scale").value = boxsize;
      } else {
        document.querySelector(".scale").value = 10;
      }
    }


    function openTab(evt, tabname) {
      // Declare all variables
      var i, tabcontent, tablinks;
    
      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
    
      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
    
      // Show the current tab, and add an "active" class to the button that opened the tab
      activeTab = tabname;
      document.getElementById(tabname).style.display = "block";
      evt.currentTarget.className += " active";
    }
    
    let presets = [
      {
        name: "Mount Everest",
        id: "everest",
        coords: ["27.988056","86.925278"],
        scale: 100,
        lod: 50,
        pointiness: 8
      },
      {
        name: "The Grand Canyon",
        id: "grandcanyon",
        coords: ["36.13182226854804","-111.97123914864754"],
        scale: 100,
        lod: 70,
        pointiness: 5
      },
      {
        name: "Tokyo",
        id: "tokyo",
        coords: ["35.6894875","139.6917064"],
        scale: 100,
        lod: 50,
        pointiness: 3
      }, 
      {
        name: "Mount Fuji",
        id: "fuji",
        coords: ["35.360556","138.727778"],
        scale: 50,
        lod: 50,
        pointiness: 8
      },
      {
        name: "Mount Kilimanjaro",
        id: "kilimanjaro",
        coords: ["-3.067417","37.353611"],
        scale: 100,
        lod: 50,
        pointiness: 8
      },
      //Do a city now
      {
        name: "London",
      id: "london",
      coords: ["51.507222","-0.1275"],
      scale: 100,
      lod: 50,
      pointiness: 3
    },
    {
      name: "Paris",
      id: "paris",
      coords: ["48.856667","2.350987"],
      scale: 100,
      lod: 50,
      pointiness: 3
    },
    {
      name: "Sydney",
      id: "sydney",
      coords: ["-33.8688197","151.2092955"],
      scale: 100,
      lod: 50,
      pointiness: 3
    },
    {
      name: "New York City",
      id: "nyc",
      coords: ["40.7127753","-74.0059728"],
      //scale shoudl be the width of the metro area
      scale: 184,
      lod: 50,
      pointiness: 3
    },
    {
      name: "San Francisco",
      id: "sanfran",
      coords: ["37.7749295","-122.4194155"],
      scale: 120,
      lod: 50,
      pointiness: 3
    },
    {
      name: "Rio de Janeiro",
      id: "rio",
      coords: ["-22.9068467","-43.1728965"],
      scale: 100,
      lod: 50,
      pointiness: 3
    },
    //Some geogrpahic features that aren't mountains
    {
      name: "The Amazon River",
      id: "amazon",
      coords: ["-3.4166667","-65.85"],
      scale: 1000,
      lod: 50,
      pointiness: 3
    },
    {
      name: "The Alps",
      id: "alps",
      coords: ["46.42208310951177","9.931870431505684"],
      scale: 1000,
      lod: 70,
      pointiness: 4
    },
    ]

    //When the page loads, add each preset as an option element in the select element with id "presets"
    window.addEventListener("load", function(){
      let presetsSelect = document.querySelector("#presets");
      for(let preset of presets){
        let option = document.createElement("option");
        option.value = preset.id;
        option.innerHTML = preset.name;
        presetsSelect.appendChild(option);
      }
    });

        //When the user changes the preset input, update the pointiness and scale to match the object
        presetInput.onchange = function(){
          let preset = presetInput.value;
          console.log(preset);
          for(let i = 0; i < presets.length; i++){
            if(presets[i].id == preset){
              pointinessInput.value = presets[i].pointiness;
              lodInput.value = presets[i].lod;
              break;
            }
          }
        }


// Tshirt code
// let tshirtButton = document.querySelector("#merch");

// tshirtButton.addEventListener('click', (e) => {
//   const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZWVtaWxsLmNvbSIsIm5iZiI6MTY4MTE1Njk0MSwiaWF0IjoxNjgxMTU2OTQxLCJzdWIiOjI4MDY5MywiZXhwIjo5OTk5OTk5OTk5OTksInV1aWQiOiI2NDM0NmI0ZDkyNDcxIiwidG9rZW5faWQiOjY2LCJjcmVhdGVkX2F0IjoxNjgxMTU2OTQxfQ.2WvsFzYGjfBlV1FOhesp7ze-BEnjeE0tw48Bx7ehafM'
//   let canvas = document.querySelector("#chart1");
//   const base64_image = canvas.toDataURL();
//    // Set the fields to submit. image_url is the only required field for the API request. If you want, you can set the product name, description and price. You can also change the product type and colours using item_code and colours. To find an up-to-date list of available options for these fields, visit this endpoint: https://teemill.com/omnis/v3/product/options/
//    const options = {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       image_url: base64_image,
//       item_code: "RNA1",
//       name: "Doodle Tee",
//       colours: "Black",
//       description: "Check out this awesome doodle tee, printed on an organic cotton t-shirt in a renewable energy powered factory, created via the Teemill API.",
//       price: 20.00,
//     }),
//   };
  
//   // Open a new tab, ready to receive the product URL
//   var newTab = window.open('about:blank', '_blank');
//   newTab.document.write("Loading...");

//   // Send the API request, and redirect the new tab to the URL that is returned
//   fetch('https://teemill.com/omnis/v3/product/create', options)
//     .then(response => response.json())
//     .then(response => newTab.location.href = response.url)
//     .catch(err => console.error(err));
// });