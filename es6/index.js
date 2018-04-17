// Change this to get detailed logging from the stomp library
try {

    //  Keeping the connection to STOMP code as it is.
    const DEBUG = false;

    const url = "ws://localhost:8011/stomp";
    const client = Stomp.client(url);
    client.debug = function (msg) {
        if (DEBUG) {
            console.info(msg);
        }
    }

    const connectCallback = () => {
        // Initialize creation of currency pair table only on successfull connection to the stomp.
        client.subscribe('/fx/prices', pricesDataCallback);

        //  Initialize the currency pairs HTML table
        initializeTable();

        //  Show connection success message.
        document.getElementById('message').innerHTML = "Connected to STOMP.";
    }

    client.connect({}, connectCallback, error => {
        document.getElementById('message').innerHTML = error.headers.message;
    });
}
catch (error) {
    alert(error);
}
