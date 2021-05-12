const { GoogleSpreadsheet } = require('google-spreadsheet');
const { promisify } = require('util')

const creds = require('./client_secret.json');

let list = [];

function getRow(row) {
    list.push(row.id);
}

async function accessSpreadsheet() {
    const doc = new GoogleSpreadsheet('1k22ZS17H9xcbmFZagpCPWEMEtQ9sPnyrUeMIt9DvExI');
    await doc.useServiceAccountAuth(creds);
    const info = await doc.getInfo();
    const sheet = await doc.sheetsByIndex[0];
    // console.log(`Title: ${sheet.title}, Rows: ${sheet.rowCount}`);

    const rows = await sheet.getRows({
        offset: 0
    });

    rows.forEach(row => {
        getRow(row);
    })

    console.log(list);
}

accessSpreadsheet();