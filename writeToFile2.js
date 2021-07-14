const fs = require('fs');
const kaltura = require('kaltura-client');
// Kaltura
const config = new kaltura.Configuration();
config.serviceUrl = 'https://www.kaltura.com';
const client = new kaltura.Client(config);

// Sheets
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { promisify } = require('util')
const creds = require('./client_secret.json');

let idList = [];
let list = [];
let resultStore;

accessSpreadsheet().then(() => {
    console.log("finished");
});

async function listCaptionFinder(listOfIds) {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    let promiseArray = [];

    for (Asset of listOfIds) {
        await delay(50);
        promiseArray.push(hasCaptionsPromise(Asset));
    }

    // for (ID of listOfIds) {
    //     promiseArray.push(hasCaptionsPromise(ID));
    // }

    Promise.all(promiseArray).then((values) => {
        console.log(values);
        // Take list of returned objects and convert to string
        let stringToWrite = JSON.stringify(values);
        // Add a bit of formatting to match JSON format
        stringToWrite = '{ "list":' + stringToWrite + "}";

        fs.writeFile("output.json", stringToWrite, () => {});
        
        /* old ways of writing
        fs.writeFile("output.txt", JSON.stringify(values), () => {});
        fs.writeFile("output.txt", stringToWrite, () => {});
        */
    }).catch((error) => {
        console.log(error, "error");
    });
}


function hasCaptionsPromise(Asset) {
    return new Promise((resolve, reject) => {
        kaltura.services.session.start(
                "6e2753acd5c56f7d5b7e41d711e27f1e",
                "captions@usu.edu",
                kaltura.enums.SessionType.ADMIN,
                1530551)
            .completion((success, ks) => {
                if (!success) throw new Error(ks.message);
                client.setKs(ks);
                let filter = new kaltura.objects.CaptionAssetItemFilter();
                filter.formatEqual = kaltura.enums.CaptionType.SRT;
                // Change Id here
                filter.entryIdEqual = Asset.id;
                let pager = new kaltura.objects.FilterPager();

                kaltura.services.captionAsset.listAction(filter, pager)
                    .execute(client)
                    .then(result => {
                        resultStore = result;
                        console.log(result);
                        if (result.totalCount != 0) {
                            let answer = { name: Asset.name, id: Asset.id, captions: true };
                            resolve(answer);
                        } else {
                            let answer = { name: Asset.name, id: Asset.id, captions: false };
                            resolve(answer);
                        }

                        /*
                        console.log(result);
                        console.log('\n');
                        console.log(result.objects);
                        console.log('\n');
                        console.log(result.totalCount);
                        */
                    });
            })
            .execute(client);
    })
    // one with captions: 0_lzwa9iqb
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

    listCaptionFinder(idList);
}

function getRow(row) {
    let rowObject = {
        name: row.content_name,
        id: row.id
    }
    idList.push(rowObject);
}