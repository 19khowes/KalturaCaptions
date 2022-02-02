// Used to convert a .json file to a .csv file

const fs = require('fs');

loadData();

function loadData() {
    fs.readFile('./output.json', 'utf8', printData);
}

function printData(error, response) {
    if (error) {
        console.error(error);
        return;
    }
    
    data = JSON.parse(response);
    
    // Manually converts JSON to CSV
    dataArray = data.list;
    let fields = Object.keys(dataArray[0]);
    let replacer = function(key, value) { return value === null ? '' : value };
    let csv = dataArray.map(function (row){
        return fields.map(function(fieldName){
            return JSON.stringify(row[fieldName], replacer)
        }).join(',');
    });
    csv.unshift(fields.join(','));
    csv = csv.join('\r\n');
    console.log(csv);

    // write csv data to .csv file
    fs.writeFile('output.csv', csv, 'utf8', doneWriting);
}

function doneWriting() {
    console.log('done writing csv');
}