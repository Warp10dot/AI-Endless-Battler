//console commands
//Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
// ^ To ignore the digitally signed script error
// npm start
// ^ to launch the locally run test server
//Make sure to run this in the Endless-Battler folder.

//TODO: Log of battles to prevent repeat battles
// Pass a list of battles to the server, and then check if the battle has already been fought.
// Also change how the log is handled so it uses the array


const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { checkResult } = require('./battler.js'); // Import the checkResult function
require('dotenv').config();

const app = express();
const PORT = 30000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

app.post('/api/send', (req, res) => {
    const message = (req.body.message[0]);
    const defender = (req.body.message[1]);
    const log = (req.body.message[2] || '');
    console.log("Received message!!!!: ", message + " Defender: " + defender);
    checkResult(message, defender, log).then(result => {
    console.log('Sending result:', result.winner);
    res.json({ result });
    }).catch(error => {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });
})

//Start server
app.listen(PORT, () => {
    console.log(`Server running`);
})

// app.listen(PORT, '0.0.0.0', () => {
//   console.log('Server is running');
// });

