// Pulls kaltura entries from "test.csv" and writes whether each entry has captions or not to a .json file (output.json)

const fs = require("fs");
const prompt = require("prompt-sync")();
const parse = require("csv-parse/sync");
// Kaltura
const kaltura = require("kaltura-client");
const config = new kaltura.Configuration();
config.serviceUrl = "https://www.kaltura.com";
const client = new kaltura.Client(config);

let idList = [];
let list = [];
let resultStore;

accessSpreadsheet().then(() => {
    console.log("finished");
});

async function listCaptionFinder(listOfIds) {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    let promiseArray = [];

    for (Asset of listOfIds) {
        await delay(50);
        promiseArray.push(hasCaptionsPromise(Asset));
    }

    // for (ID of listOfIds) {
    //     promiseArray.push(hasCaptionsPromise(ID));
    // }

    Promise.all(promiseArray)
        .then((values) => {
            console.log(values);
            // Take list of returned objects and convert to string
            let stringToWrite = JSON.stringify(values);
            // Add a bit of formatting to match JSON format
            stringToWrite = '{ "list":' + stringToWrite + "}";

            fs.writeFile("output.json", stringToWrite, () => {});

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
            console.log(csv);
            // write csv data to .csv file
            fs.writeFile('output.csv', csv, 'utf8', () => {
                console.log('done writing to csv');
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
                "6e2753acd5c56f7d5b7e41d711e27f1e",
                "captions@usu.edu",
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
    let column = prompt('Which Column "Entry Ids" are in (A-Z): ').trim();
    // convert column char to number (A->0, B->1, C->2, etc...)
    column = column.charCodeAt() - 65;
    console.log(column);

    // read in the list of ID's from the .csv file
    const stringCSV = fs.readFileSync(filename).toString();

    const records = parse.parse(stringCSV, {
        colums: true,
        skip_empty_lines: true
    });

    console.log(records);

    const columnX = records.map(rec => rec["Entry Ids"]);
    console.log(columnX);
    //listCaptionFinder(idList);
}