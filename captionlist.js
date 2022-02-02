// Finds whether a given kalutra entry (in idList) has captions or not, and prints out in .json format

const kaltura = require('kaltura-client');
const config = new kaltura.Configuration();
config.serviceUrl = 'https://www.kaltura.com';
const client = new kaltura.Client(config);

let idList = ["0_lzwa9iqb", "1_lg4czjhh", "1_qoumt81r", "1_wsj72tc3"];
let list = [];
let resultStore;

listCaptionFinder(idList);

function listCaptionFinder(listOfIds) {
    for (let i = 0; i < listOfIds.length; i++) {
        hasCaptionsPromise(listOfIds[i]).then((message) => {
            console.log("resolve for " + listOfIds[i]);
            list.push({
                id: message,
                captions: true
            });
            console.log(list);
        }).catch((message) => {
            console.log("reject for " + listOfIds[i]);
            list.push({
                id: message,
                captions: false
            });
            console.log(list);
        });
    }
}


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