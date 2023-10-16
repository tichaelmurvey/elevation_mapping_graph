const express = require('express');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 3000;
const source = process.env.SOURCE;
const latDecimalConversion = 111000; //Distance between degrees of latitude

app.get('/', (req, res) => {
    //Params: location, lines, detail, scale
    const location = req.query.location.split(',');
    const lines = req.query.lines;
    const detail = req.query.detail;
    const scale = req.query.scale;
    //Get grid of points
    console.log("Got request for grid of points")
    let promiseList = [];
    let totalLatDegrees = scale / latDecimalConversion; //Total degrees of latitude within the grid
    let latDegreeInterval = totalLatDegrees / lines; //Number of degrees of latitude between fetch points
    for (let i = lines-1; i > 0; i--) {
        let latToGet = Number(location[0]) + totalLatDegrees / 2 - latDegreeInterval * i;
        let baseLong = Number(location[1]);
        let longDecimalConversion = longitudeDistance(latToGet); //Distance between degrees of longitude at the given latitude
        let totalLongDegrees = scale / longDecimalConversion;
        let minCoord = [latToGet, baseLong - totalLongDegrees / 2];
        let maxCoord = [latToGet, baseLong + totalLongDegrees / 2];
        console.log("getting line " + (i) +" between" + minCoord + " and " + maxCoord);
        let fetchURL = `http://${process.env.SOURCE}/v1/aster30m?locations=${minCoord.join(",") + "|" + maxCoord.join(",")}&samples=${detail}`;
        console.log(fetchURL)
        promiseList.push(
          fetch(fetchURL)
        )
      }
    console.log("constructed promise list");
    Promise.all(promiseList)
    .then(responses => {
      return Promise.all(responses.map(response => response.json()))
    })
    .then(responses => {
      //Build grid
      //console.log(response[0].results);
      let grid = responses.map((line, lineIndex) => {
        //Check if line is defined
        console.log(line)
        if (line.results == undefined) {
          console.log("dropped line " + lineIndex+ " at latitude" + (Number(location[0]) + totalLatDegrees / 2 - latDegreeInterval * lineIndex))
          return ["line failed"];
        }
        else return line.results.map(point => {
          return point.elevation
          });
      });
      return grid;
    })
    .then(response => {
      res.send(response);
    })
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    }
);

function longitudeDistance(latitude) {
    var latitudeRadians = latitude * Math.PI / 180;
    return ((Math.PI / 180) * 6368000 * Math.cos(latitudeRadians));
  }