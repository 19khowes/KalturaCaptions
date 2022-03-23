// Pulls kaltura entries from "test.csv" and writes whether each entry has captions or not to a .json file (output.json)
require('dotenv').config()
const fs = require("fs");
const prompt = require("prompt-sync")();
const parse = require("csv-parse/sync");
// Kaltura
const kaltura = require("kaltura-client");
const config = new kaltura.Configuration();
config.serviceUrl = "https://www.kaltura.com";
const client = new kaltura.Client(config);

/* CHANGE NUMBERS TO MATCH DATA FORMAT*/

const courseIDColumn = 0; // DEFAULT is A -> 0
const courseNameColumn = 1; // DEFAULT is B -> 1
const contentNameColumn = 3; // DEFAULT is D -> 3
const entryIDColumn = 11; // DEFAULT is L -> 11

/**************************************/

let idList = [];
let list = [];
let resultStore;
accessSpreadsheet().then(() => {
    console.log("finished reading in file");
});

async function listCaptionFinder(listOfIds) {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    let promiseArray = [];

    for (Asset of listOfIds) {
        await delay(50);
        promiseArray.push(hasCaptionsPromise(Asset));
    }
    
    // when all kaltura info sessions are done
    Promise.all(promiseArray)
        .then((values) => {
            console.log(values);

            // Take list of returned objects and convert to string
            let stringToWrite = JSON.stringify(values);
            // Add a bit of formatting to match JSON format
            stringToWrite = '{ "list":' + stringToWrite + "}";

            fs.writeFile("./output/output.json", stringToWrite, () => {
                console.log("finished writing to json")
            });

            // Manually converts JSON to CSV
            let fields = Object.keys(values[0]);
            let replacer = function (key, value) {
                return value === null ? "" : value;
            };
            let csv = values.map(function (row) {
                return fields.map(function (fieldName) {
                    return JSON.stringify(row[fieldName], replacer);
                }).join(",");
            });
            csv.unshift(fields.join(","));
            csv = csv.join("\r\n");

            // write csv data to .csv file
            fs.writeFile('./output/output.csv', csv, 'utf8', () => {
                console.log('finished writing to csv');
            });
        })
        .catch((error) => {
            console.log(error, "error");
        });
}

function hasCaptionsPromise(Asset) {
    return new Promise((resolve, reject) => {
        kaltura.services.session
            .start(
                process.env.API_KEY,
                process.env.ACCOUNT,
                kaltura.enums.SessionType.ADMIN,
                1530551
            )
            .completion((success, ks) => {
                if (!success) throw new Error(ks.message);
                client.setKs(ks);
                // Set filter and do kaltura.services.captionAssest.ListAction
                // Could maybe do the code here that loops through the whole id list
                // without starting a new Kaltura session each time
                let filter = new kaltura.objects.CaptionAssetItemFilter();
                filter.formatEqual = kaltura.enums.CaptionType.SRT;
                // Change Id here
                filter.entryIdEqual = Asset.id;
                let pager = new kaltura.objects.FilterPager();

                kaltura.services.captionAsset
                    .listAction(filter, pager)
                    .execute(client)
                    .then((result) => {
                        resultStore = result;
                        // console.log(result);
                        if (result.totalCount != 0) {
                            let answer = {
                                courseid: Asset.courseid,
                                coursename: Asset.coursename,
                                name: Asset.name,
                                id: Asset.id,
                                captions: true,
                            };
                            // console.log(answer);
                            resolve(answer);
                        } else {
                            let answer = {
                                courseid: Asset.courseid,
                                coursename: Asset.coursename,
                                name: Asset.name,
                                id: Asset.id,
                                captions: false,
                            };
                            // console.log(answer)
                            resolve(answer);
                        }
                    });
            })
            .execute(client);
    });
}

async function accessSpreadsheet() {
    // ask user full name of .csv file
    const filename = prompt('Full .csv filename: ').trim();

    // read in the list of ID's from the .csv file
    const assetList = getListOfAssets(filename);

    listCaptionFinder(assetList);
}

function getListOfAssets(filename) {
    // read in file as a string
    const stringCSV = fs.readFileSync(filename).toString();

    // get as a multidimensional array
    const fullCSV = parse.parse(stringCSV, {
        colums: true,
        skip_empty_lines: true
    });

    // change to each entry in multidimensional containing objects with course attributes
    const rowAssets = fullCSV.map(rec => {
        const idArray = rec[entryIDColumn].match(/\d_\w{8}/g);
        if (idArray != null) {
            const assetArray = [];
            for (courseEntry of idArray) {
                assetArray.push({
                    courseid: rec[courseIDColumn],
                    coursename: rec[courseNameColumn],
                    name: rec[contentNameColumn],
                    id: courseEntry
                });
            }
            return assetArray;
        }
        return null;
    });

    // clear out null rows (without an entry id)
    for (let i = rowAssets.length; i >= 0; i--) {
        if (rowAssets[i] == null) {
            rowAssets.splice(i, 1);
        }
    }

    // flatten to a single dimensional array
    const assets = [];
    for (row of rowAssets) {
        for (asset of row) {
            assets.push(asset);
        }
    }

    return assets;
}