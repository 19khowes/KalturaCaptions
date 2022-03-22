// Prints out some basic data from output.json

const fs = require('fs');
let captionTrue = 0;
let captionFalse = 0;
let total = 0;
let data;
let dataArray;

loadData();

function loadData() {
    fs.readFile('./output/output.json', 'utf8', printData);
}

function printData(error, response) {
    if (error) {
        console.error(error);
        return;
    }
    
    data = JSON.parse(response);

    // Use loaded data below here
    dataArray = data.list;

    for (asset of dataArray) {
        total++;
        if (asset.captions == true) {
            captionTrue++;
        } else {
            captionFalse++;
        }
    }
    console.log(`true: ${captionTrue}`);
    console.log(`percent true: ${captionTrue/total * 100}\n`);
    console.log(`false: ${captionFalse}`);
    console.log(`percent false: ${captionFalse/total *100}\n`);
    console.log(`total: ${total}`);
}