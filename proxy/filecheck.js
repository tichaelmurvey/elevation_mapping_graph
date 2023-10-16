const { response } = require('express');

require('dotenv').config();
const source = process.env.SOURCE;

//Construct list of all latitude and longitude points
let latList = [];
let longList = [];
for(let i = -90; i <= 90; i++) {
  latList.push(i);
}

for(let i = -180; i <= 180; i++) {
  longList.push(i);
}

//Construct list of all points to fetch
let fetchList = [];
latList.forEach(lat => {
  longList.forEach(long => {
    fetchList.push([lat, long]);
  });
});
//Limit to first 100 points
fetchList = fetchList.slice(0, 174);
//Construct promise list
let promiseList = [];
fetchList.forEach(point => {
  promiseList.push(
    fetch(`http://${source}/v1/aster30m?locations=${point.join(",")}`)
  );
});

Promise.all(promiseList).then(responses => {
    return Promise.all(responses.map(response => {
        //check if response is valid
        if(response.status != 200) {
            console.log(response);
        }
        return response.json()
        }
        ))
    })
    .then(responses =>{
        responses.forEach(response => {
            if (response.results == undefined) {
                console.log(response);
            }
            else {
                console.log(response.results);
            }
        })
    })