elevationButton = document.querySelector(".getElevation");
coordInput = document.querySelector(".coords");
scaleInput = document.querySelector(".scale");
pointinessInput = document.querySelector(".pointiness");
lodInput = document.querySelector(".lod");

const callNumber = 1; //Number of calls to make per interval
const callDelay = 1000; //time between API calls
const latDecimalConversion = 111000; //Distance between degrees of latitude

let distance = 10000; //Size of graph in meters
let numPoints = 100; //Number of points to grab in each axis within the size
let heightScale = 10;

let lineOffset;
let totalLatDegrees;
let latDegreeInterval;

let elevationGrid = [];
let intervalTracker;
let chunkCounter = 0;
let locationSteepness;

elevationButton.addEventListener("click", getElevationGrid);

async function getElevationGrid(){
    clearInterval(intervalTracker);
    document.querySelector(".placename").textContent = "";
    let fetchList = [];
    elevationGrid = [];
    
    originalCoords = coordInput.value.split(",");
    distance = scaleInput.value*1000;
    numPoints = lodInput.value;
    // heightScale = Math.log(distance)*pointinessInput.value*0.25;

    lineOffset = distance/numPoints; //Distance between intervals for the purpose of graphing
    totalLatDegrees = distance/latDecimalConversion; //Total degrees of latitude within the grid
    latDegreeInterval = totalLatDegrees/numPoints; //Number of degrees of lattitude between fetch points
    

    for(let i=0; i<numPoints; i++){
        let latToGet = Number(originalCoords[0]) + totalLatDegrees/2 - latDegreeInterval*i;
        let longDecimalConversion = longitudeDistance(latToGet); //Distance between degrees of longitude at the given latitude
        let totalLongDegrees = distance/longDecimalConversion;
        let longDegreeInterval = totalLongDegrees/numPoints;
        coordset = [];
        for(let j=0; j<numPoints; j++){
            let newCoord = [0,0];
            newCoord[0] = latToGet;
            newCoord[1] = originalCoords[1] - totalLongDegrees/2 + longDegreeInterval*j;
            coordset.push(newCoord.join(","));
        }
        let latString = coordset.join("|");
        //fetchList.push('https://powerful-hollows-31672.herokuapp.com/https://api.opentopodata.org/v1/aster30m?locations='+latString);
        //fetchList.push('https://api.opentopodata.org/v1/aster30m?locations='+latString);
        fetchList.push('/api/'+latString);
    }
    getDataChunk(fetchList);
    intervalTracker = setInterval(getDataChunk, callDelay, fetchList);
}

function getDataChunk(fetchList){
    console.log("starting a new chunk interval");
    if(fetchList.length > 0){
        //Send 5 requests and add to dataset
        let requestChunk = [];
        for(i=0; i<callNumber; i++){
            requestChunk.push(fetchList.shift());
        }
        console.log("getting a chunk of " + requestChunk.length + " requests");
        Promise.all(requestChunk.map(line=>fetch(line))).then(function(responses){
            return Promise.all(responses.map(function(response){
                return response.json();
            }))
        }).then( function(data){
            let localElevationData = extractElevation(data);
            elevationGrid.push(localElevationData)
            // updateTableHTML();
            updateGraph();
        }).catch(function(error){
            console.log(error);
        })
    
    } else {
        //Render the table
        //updateTableHTML(elevationGrid);
        console.log("done with requests");
        clearInterval(intervalTracker);
        endOfMap();
    }
    chunkCounter++;
}


function updateGraph(){
//Offset the lines 
    lowestPoint = 100000;
    highestPoint = 0;
    elevationGraphData = JSON.parse(JSON.stringify(elevationGrid));
    elevationGraphData.forEach((line, index) => { 
        line.forEach((value, index2) => {
            if(line[index2] > highestPoint){highestPoint = line[index2]}
            if(line[index2] < lowestPoint){lowestPoint = line[index2]}
        })
     })
     locationSteepness = highestPoint - lowestPoint; 
     //Set height modification so that the percentage of space occupied matches the steepness
     let percentageMountain = (pointinessInput.value/2.5)/10;
     heightScale = (percentageMountain*distance)/locationSteepness

     //Scale the elevation from the base point (lowest)
     console.log("Lowest point: " + lowestPoint);
     console.log("Highest point: " + highestPoint);
     elevationGraphData.forEach((line, index) => {
        line.forEach((value, index2) => {
            //Set 0 to the loweset point
            line[index2] = line[index2] - lowestPoint;
            //Add scaling factor
            line[index2] = line[index2]*heightScale;
            //Add the total height so it draws from the top
            line[index2] += lineOffset*numPoints;

        })
    })
    //Add the offset to stagger lines
    elevationGraphData.forEach((line, index) => {
        line.forEach((value, index2) => {
            line[index2] -= lineOffset*index;
        })
    })
// Initialize a Line chart in the container with the ID chart
    console.log("updating chart")
    let myChart = new Chartist.Line('#chart1', {
    series: elevationGraphData
  },{
    fullWidth: false,
    showPoint: false,
    low: 0,
    high: distance+locationSteepness,
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
//   let lineSVGs = document.querySelectorAll(".ct-line");
//   let lastLine = lineSVGs[lineSVGs.length-1];
//   lastLine.classList.add('hide');
  //console.log(lastLine);
}

function extractElevation(data){
    console.log(data);
    let elevationList =[];
    data[0].results.forEach(datum => elevationList.push(datum.elevation));
    return elevationList;
}

function longitudeDistance(latitude){
    var latitudeRadians = latitude * Math.PI / 180;
    return ((Math.PI/180) *6368000*Math.cos(latitudeRadians));
}

function makeLastPurple(){
    let lineSVGs = document.querySelectorAll(".ct-line");
    let lastLine = lineSVGs[lineSVGs.length-1];
    console.log(lastLine);
    lastLine.classList.add('hide');
}

function endOfMap(){
    document.querySelector(".placename").textContent = document.querySelector(".location").value;
}