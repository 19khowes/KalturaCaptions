const fs = require('fs');
const kaltura = require('kaltura-client');
// Kaltura
const config = new kaltura.Configuration();
config.serviceUrl = 'https://www.kaltura.com';
const client = new kaltura.Client(config);

// Sheets
const {
    GoogleSpreadsheet
} = require('google-spreadsheet');
const {
    promisify
} = require('util')
const creds = require('./client_secret.json');

let idList = [];
let list = [];
let resultStore;

accessSpreadsheet().then((idList) => {
    listCaptionFinder(idList);
});

async function listCaptionFinder(listOfIds) {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    let promiseArray = [];

    kaltura.services.session.start(
            "6e2753acd5c56f7d5b7e41d711e27f1e",
            "captions@usu.edu",
            kaltura.enums.SessionType.ADMIN,
            1530551)
        .completion((success, ks) => {
            if (!success) throw new Error(ks.message);
            client.setKs(ks);

            // Set filter and do kaltura.services.captionAssest.ListAction 
            // Could maybe do the code here that loops through the whole id list
            // without starting a new Kaltura session each time
            for (Asset of listOfIds) {
                promiseArray.push(hasCaptions(Asset, kaltura));
            }

            Promise.all(promiseArray).then((values) => {
                console.log(values);
                // Take list of returned objects and convert to string
                let stringToWrite = JSON.stringify(values);
                // Add a bit of formatting to match JSON format
                stringToWrite = '{ "list":' + stringToWrite + "}";

                fs.writeFile("output.json", stringToWrite, () => {});

            }).catch((error) => {
                console.log(error, "error");
                fs.writeFile("output.txt", "error", () => {});
            });
        })
        .execute(client);


    // for (Asset of listOfIds) {
    //     await delay(50);
    //     promiseArray.push(hasCaptions(Asset));
    // }


    // Promise.all(promiseArray).then((values) => {
    //     console.log(values);
    //     // Take list of returned objects and convert to string
    //     let stringToWrite = JSON.stringify(values);
    //     // Add a bit of formatting to match JSON format
    //     stringToWrite = '{ "list":' + stringToWrite + "}";

    //     fs.writeFile("output.json", stringToWrite, () => {});

    // }).catch((error) => {
    //     console.log(error, "error");
    // });
}

function hasCaptions(Asset, kaltura) {
    return new Promise((resolve, reject) => {
        let filter = new kaltura.objects.CaptionAssetItemFilter();
        filter.formatEqual = kaltura.enums.CaptionType.SRT;
        // Change Id here
        filter.entryIdEqual = Asset.id;
        let pager = new kaltura.objects.FilterPager();

        kaltura.services.captionAsset.listAction(filter, pager)
            .execute(client)
            .then(result => {
                resultStore = result;
                //console.log(result);
                if (result.totalCount != 0) {
                    let answer = {
                        name: Asset.name,
                        id: Asset.id,
                        captions: true
                    };
                    // console.log(answer);
                    resolve(answer);
                } else {
                    let answer = {
                        name: Asset.name,
                        id: Asset.id,
                        captions: false
                    };
                    // console.log(answer);
                    resolve(answer);
                }

            });
    })
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

    //listCaptionFinder(idList);
    return idList;
}

function getRow(row) {
    let rowObject = {
        name: row.content_name,
        id: row.id
    }
    idList.push(rowObject);
}