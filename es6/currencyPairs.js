//  This is an array holding the updated values of all currency pairs.
let currencyPairs = [];

//  This is an array of objects containing the columns to display in the table.
const columns = [
    { name: 'Name', key: 'name' },
    { name: 'Current Best Bid', key: 'bestBid' },
    { name: 'Current Best Ask', key: 'bestAsk' },
    { name: 'Last Changed Bid', key: 'lastChangeBid' },
    { name: 'Last Changed Ask', key: 'lastChangeAsk' },
    { name: 'Sparkline Graph', key: 'sparkline' },
];

//  This is an array holding the sparkline api objects for each distinct currency pair.
let sparklineCellRef = [];

//  This is an array holding the sparkline graph data for each sparkline api objects.
let sparklineCellData = [];

//This holds the current pairs table element reference.
let currencyPairsTable = '';

/**
 * This function is used to add/replace the data which we get from STOMP response.
 * @param {*} currencyPairResponse 
 */
processData = currencyPairResponse => {
    //  Converting the response from STOMP API to the JSON object
    //  Assuming everytime api sends the new/updated response
    const apiResponse = JSON.parse(currencyPairResponse.body);

    //  Get the array index of api response data into our local array
    const previousIndex = currencyPairs.findIndex(currencyPair => currencyPair.name === apiResponse.name);

    //  If api response data is not there in our local array then add the data in array and HTML table
    //  Else replace the old data with updated api response data
    if (previousIndex === -1) {

        //  Calculate the midPrice for sparkline graph
        const midPrice = (parseFloat(apiResponse.bestBid) + parseFloat(apiResponse.bestAsk)) / 2;

        //  Save the midPrice data in a sparkline cell data array for further use
        sparklineCellData['sparkline' + apiResponse.name] = [midPrice];

        //  Insert api response data into our local array
        currencyPairs.push(apiResponse);

        //  Sort the array in descending order of lastChangeBid
        currencyPairs = _.orderBy(currencyPairs, ['lastChangeBid'], ['desc']);

        //  Get the current index for newly added data into our local array
        const currentIndex = currencyPairs.findIndex(currencyPair => currencyPair.name === apiResponse.name);

        //  Write the newly received data into the HTML table
        writeTableRow(apiResponse, 'add', currentIndex);
    } else {

        //  Calculate the midPrice for sparkline graph
        const midPrice = (parseFloat(apiResponse.bestBid) + parseFloat(apiResponse.bestAsk)) / 2;

        //  Save the midPrice data in a sparkline cell data array for further use
        sparklineCellData['sparkline' + apiResponse.name].push(midPrice);

        cellRefName = `sparkline${apiResponse.name}`;

        //  Remove the newly added midPrice after 30 seconds to update and draw live sparkline graph
        setTimeout(() => {
            sparklineCellData[cellRefName].shift();
            sparklineCellRef[cellRefName].draw(sparklineCellData[cellRefName]);
        }, 30000);

        //  Replace the data in our local array with newly received data
        currencyPairs[previousIndex] = apiResponse;

        //  Sort the array in descending order of lastChangeBid
        currencyPairs = _.orderBy(currencyPairs, ['lastChangeBid'], ['desc']);

        //  Get the current index for replaced data into our local array
        const currentIndex = currencyPairs.findIndex(currencyPair => currencyPair.name === apiResponse.name);

        //  Write the replaced data into the table
        writeTableRow(apiResponse, 'replace', previousIndex, currentIndex);
    }
}

/**
 * This method is used to add/remove rows in currency pairs HTML table.
 * @param {*} data 
 * @param {*} type 
 * @param {*} previousIndex 
 * @param {*} currentIndex 
 */
writeTableRow = (data, type, previousIndex, currentIndex) => {
    if (type === 'replace') {
        currencyPairsTable.deleteRow(previousIndex + 1);
    }
    const row = (type === 'add') ? currencyPairsTable.insertRow(previousIndex + 1) : currencyPairsTable.insertRow(currentIndex + 1);
    let cell;
    for (let i = 0; i < columns.length; i++) {
        cell = row.insertCell(i);
        //  Check for last column of sparkline graph
        if (columns[i]['key'] === 'sparkline') {
            let cellRefName = `sparkline${data.name}`;

            //  Create a sparkline element reference object
            sparklineCellRef[cellRefName] = new Sparkline(cell, { width: 300 });

            //  Draw a sparkline graph
            sparklineCellRef[cellRefName].draw(sparklineCellData[cellRefName]);
        } else {
            cell.innerHTML = data[columns[i]['key']];
        }
    }
}

/**
 * Initialization of the currency pairs table
 */
initializeTable = () => {
    const tableContainer = document.getElementById('tableContainer');
    currencyPairsTable = document.createElement('table');
    currencyPairsTable.id = 'sorted_table';
    currencyPairsTable.style.width = '90%';

    //  Render currency pairs table column headers
    createHeaders();

    tableContainer.appendChild(currencyPairsTable);
}

/**
 * This function renders and binds the header columns to the currency pairs table.
 */
createHeaders = () => {
    const currencyPairsTableBody = document.createElement('tbody');
    let currencyPairsTableRow = document.createElement('tr');
    for (let i = 0; i < columns.length; i++) {
        let currencyPairsTableHeader = document.createElement('th');
        currencyPairsTableHeader.innerHTML = columns[i]['name'];
        currencyPairsTableRow.appendChild(currencyPairsTableHeader);
    }
    currencyPairsTableBody.appendChild(currencyPairsTableRow);
    currencyPairsTable.appendChild(currencyPairsTableBody);
}

/**
 * This function gets the updated response from STOMP Websocket, which is subscribed to the topic '/fx/prices'
 * @param {*} currencyPairResponse 
 */
pricesDataCallback = currencyPairResponse => {

    //  Throw exception if api response doesn't contain body or an empty object
    if (_.isEmpty(currencyPairResponse.body)) {
        document.getElementById('message').innerHTML = "Not connected to STOMP. Showing last updated values.";
    } else {
        processData(currencyPairResponse);
    }
}