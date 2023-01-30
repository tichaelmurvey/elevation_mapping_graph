elevationSpan = document.querySelector(".elevation");
elevationButton = document.querySelector(".getElevation");
coordInput = document.querySelector(".coords");

const distance = 1000000; //Size of graph in meters
const latDecimalConversion = 111000; //Distance between degrees of latitude
const numPoints = 100; //Number of points to grab in each axis within the size
const totalLatDegrees = distance/latDecimalConversion;
const latDegreeInterval = totalLatDegrees/numPoints;

elevationButton.addEventListener("click", getElevationGrid);

async function getElevationGrid(){
    let elevationGrid = [];
    originalCoords = coordInput.value.split(",");
    for(let i=0; i<numPoints; i++){
        let latToGet = Number(originalCoords[0]) + totalLatDegrees/2 - latDegreeInterval*i;
        console.log("Getting a latitude line at " + latToGet + " degrees");
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
        console.log(coordset);
        let coordString = coordset.join("|");
        elevationGrid[i] = await fetch('https://powerful-hollows-31672.herokuapp.com/https://api.opentopodata.org/v1/aster30m?locations='+coordString)
            .then((response) => response.json())
            .then((data) => updateElevation(data.results));
    }
    updateTableHTML(elevationGrid);
}

function updateTableHTML(elevationData) {
    var tableBody = document.querySelector(".elevation");

    // Reset the table
    tableBody.innerHTML = "";

    // Build the new table
    elevationData.forEach(function(row) {
        var newRow = document.createElement("tr");
        tableBody.appendChild(newRow);

        if (row instanceof Array) {
            row.forEach(function(cell) {
                var newCell = document.createElement("td");
                newCell.textContent = cell;
                blue = Number(cell) < 200 ? 150 - Number(cell) : 0;
                red = Number(cell) > 100 ? Number(cell) -100: 0;
                newCell.style.backgroundColor = "rgb(" + red + "," + blue + ", 0)";
                newRow.appendChild(newCell);
            });
        } else {
            newCell = document.createElement("td");
            newCell.textContent = row;
            newRow.appendChild(newCell);
        }
    });
}


function updateElevation(data){
    let elevationList =[];
    data.forEach(datum => elevationList.push(datum.elevation));
    console.log("Made an elevation list: " + elevationList);
    return elevationList;
}

function longitudeDistance(latitude){
    var latitudeRadians = latitude * Math.PI / 180;
    return ((Math.PI/180) *6368000*Math.cos(latitudeRadians));
}