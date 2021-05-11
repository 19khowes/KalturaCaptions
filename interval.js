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
const {
    resolve
} = require('path');
const { access } = require('fs');

let idList = [];
let list = [];
let i = 0;
let rows;

function accessThenCaptions() {
    accessSpreadsheet().then(() => {
        hasCaptionsPromise(idList[i]).then((message) => {
            list.push({
                id: message,
                captions: true
            });
            rows[i].query = list[i].id;
            rows[i].result = list[i].captions;
            rows[i].save();
            console.log(list);
            i++;
        }).catch((message) => {
            list.push({
                id: message,
                captions: false
            });
            rows[i].query = list[i].id;
            rows[i].result = list[i].captions;
            rows[i].save();
            console.log(list);
            i++;
        });
    }).catch(() => {
        console.error("Error??")
    });
}

setInterval(accessThenCaptions, 3000);

function hasCaptionsPromise(id) {
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
                filter.entryIdEqual = id;
                let pager = new kaltura.objects.FilterPager();

                kaltura.services.captionAsset.listAction(filter, pager)
                    .execute(client)
                    .then(result => {
                        resultStore = result;
                        console.log(result);
                        if (result.totalCount != 0) {
                            resolve(id);
                        } else {
                            reject(id);
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

    rows = await sheet.getRows({
        offset: 0
    });

    rows.forEach(row => {
        idList.push(row.id);
    })
}