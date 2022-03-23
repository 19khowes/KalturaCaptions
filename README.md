# KalturaCaptions
For use with Kaltura media inside of Canvas Instructure

## Usage
1. Get report formatted as a .csv file with course names, course id's, video entry names, and entry id's each in their own column.
2. Make sure that .csv file is in the same directory as extractAndCheck.js
3. Add .env file to the same directory and edit following the format of .envExample (you can delete .envExample after you are done)
4. Update column numbers in `extractAndCheck.js` to match the data set you have
5. Run `node extractAndCheck.js` (assumes report has course id in column A, course name in B, entry name in D, and entry id in L)
6. Results will be stored in two formats: .json and .csv, which will be located in the /output directory

## Data
For data about the data that was returned, simply run `data.js`

