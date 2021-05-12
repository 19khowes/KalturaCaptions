const {
    GoogleSpreadsheet
} = require('google-spreadsheet');
const {
    promisify
} = require('util');
const fs = require('fs');

const creds = require('./client_secret.json');

let rows;
let list = [];
let i = 0;
let data;

async function accessRows() {
    const doc = new GoogleSpreadsheet('1k22ZS17H9xcbmFZagpCPWEMEtQ9sPnyrUeMIt9DvExI');
    await doc.useServiceAccountAuth(creds);
    const info = await doc.getInfo();
    const sheet = await doc.sheetsByIndex[0];
    // console.log(`Title: ${sheet.title}, Rows: ${sheet.rowCount}`);

    rows = await sheet.getRows({
        offset: 0
    });
}

accessRows().then(() => {
    readJSONFile("output.txt", function (callBackData) {
        data = JSON.parse(callBackData);
    });
    setTimeout(() => {
        setInterval(writeRows, 1000);
    }, 5000)
}).catch((err) => {
    console.log(err);
});


function writeRows() {
    console.log(data);
    rows[i].query = data[i].id;
    rows[i].save();

    rows[i].result = data[i].captions;
    rows[i].save();

    i++;
}

function readJSONFile(filePath, callback) {
    fs.readFile(filePath, function (err, callbackData) {
        callback(callbackData);
    })
}