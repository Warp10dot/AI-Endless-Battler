// Handles the primary logic for checking the result of battles between characters.
// It sanitizes the input, checks if the outcome already exists in the database, and if not, it determines the winner using OpenAI's API.
// SQL Server is also managed here. 
// The SQLite database is very small so it is included in the same file, but probably should be separated in the future, especially if the database grows larger (ie a high score table)

module.exports = { checkResult };

const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('./OpenAI.js');


// SQLite setup
const db = new sqlite3.Database('./messages.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        winner TEXT,
        numberOfTimes INTEGER,
        victoryReason TEXT,
        emoji TEXT
    );`);
});

// Primary function to check the result of a battle between two characters
// It sanitizes the input, checks if the outcome already exists in the database, and if not, it determines the winner using OpenAI's API.
// It then formats the result and returns it for further use, such as displaying to the user
// log is from the front end and is not a list, but a string that is used to display the result of the battle.
// Attacker is what the user put in, and defender is either the starting foe or the last winner.
async function checkResult(attacker, defender, log){
    try {
        //Sanitizing input
        attacker = attacker.toLowerCase();
        defender = defender.toLowerCase();
        // Remove everything except alphabet characters and spaces
        attacker = attacker.replace(/[^a-zA-Z ]/g, '');
        defender = defender.replace(/[^a-zA-Z ]/g, '');
        // Remove multiple spaces
        attacker = attacker.replace(/  +/g, ' ');
        defender = defender.replace(/  +/g, ' ');

        let winner = null;
        let numberOfTimes = null;
        let victoryReason = null;
        let emoji = null;

        if(await checkIfOutcomeExists("" + attacker + defender)){
            //Outcome already exists in the database
            let result = await getResult("" + attacker + defender);
            victoryReason = result.victoryReason;
            emoji = result.emoji;
            console.log(emoji);
            winner = result.winner.toLowerCase();
            insertResult("" + attacker + defender, winner, 1, victoryReason, emoji);
            numberOfTimes = result.numberOfTimes;
        } else { 
            //Outcome does not exist, so we need to determine the winner and insert it into the database
            winner = await OpenAI.determineWinner(attacker, defender);
            winner = winner.toLowerCase();
            victoryReason = await OpenAI.victoryReason(attacker, defender, winner);  
            emoji = await OpenAI.getEmoji(winner);
            insertResult("" + attacker + defender, winner, 1, victoryReason, emoji);
            console.log("Winner: " + winner + " Reason: " + victoryReason);	
            numberOfTimes = 0;
    }
    let win = false; 
    let nextFight = ''

    // Creating the log message
    if (winner === attacker.toLowerCase()) {
        win = true;
        nextFight = "What defeats " + attacker.replace(/\b\w/g, c => c.toUpperCase()) + "?";
        log = `${log} ${attacker.replace(/\b\w/g, c => c.toUpperCase())} 🤜 ${defender.replace(/\b\w/g, c => c.toUpperCase())}   ->   `;
    } else {
        log = log + "❌";
    }
    
    // Color for the result
    let color = "black";
    if(win === true){
        color = "green";
    } else {
        color = "red";
    }
    let numberOfTimesText = numberText(numberOfTimes, win, attacker, defender);
    let winText = winnerText(attacker, defender, win);
    let frontResult = { winner, winText, numberOfTimesText, victoryReason, emoji, color, nextFight, win, log };
    return frontResult;
    } catch (error) {
        console.error("Error handling result:", error);
    }
};

// Function to format the number of times a battle has been fought, returns a string which is used to tell the user how many times the battle has been fought
// numberOfTimes is the number of times the battle has been fought
// win is a boolean that indicates if the user won or lost
function numberText(numberOfTimes, win, attacker, defender) { 

    attacker = attacker.replace(/\b\w/g, c => c.toUpperCase());
    defender = defender.replace(/\b\w/g, c => c.toUpperCase());

    if (numberOfTimes === 1 && win) {
        return `One other person has defeated ${defender} with ${attacker}.`;
    } else if (numberOfTimes === 1 && !win) {
        return `One other person has tried to defeat ${defender} with ${attacker}, but failed.`;
    }

    if( numberOfTimes > 1 && win) {
        return `${numberOfTimes} other people have defeated ${defender} with ${attacker}.`;
    }   else if (numberOfTimes > 1 && !win) {
        return `${numberOfTimes} other people have tried to defeat ${defender} with ${attacker}, but failed.`;
    }

    if (numberOfTimes <= 0 && win) {
        return `You are the first person to defeat ${defender} with ${attacker}.`;
    } else if (numberOfTimes === 0 && !win) {
        return `You are the first person to try to defeat ${defender} with ${attacker}, but failed.`;
    }
}

// Function to format the winner text, returns a string which is used to tell the user who won the battle
// Future improvement: Add a list of different ways to say the same thing, so that it is not always the same text 
function winnerText(attacker, defender, win) {
    if( win ) {
        return `${attacker.replace(/\b\w/g, c => c.toUpperCase())} defeats ${defender.replace(/\b\w/g, c => c.toUpperCase())}`; 
    } else {
        return `${attacker.replace(/\b\w/g, c => c.toUpperCase())} does NOT defeat ${defender.replace(/\b\w/g, c => c.toUpperCase())}`;
    }
}   


// Database functions

// Function to insert result into the database
// If the result already exists, it will update the number of times it has been fought
function insertResult(key, winner, numberOfTimes, victoryReason, emoji) {
   db.run(`INSERT INTO messages (id, winner, numberOfTimes, victoryReason, emoji)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     numberOfTimes = numberOfTimes + 1,
     winner = excluded.winner,
     victoryReason = excluded.victoryReason,
     emoji = excluded.emoji`,
     [key, winner, numberOfTimes, victoryReason, emoji], 
     function(err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Inserted row with id ${this.lastID}`);
        }
    }); 
}

// Function to get result from the database
function getResult(key) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM messages WHERE id = ?", [key], (err, row) => {
            if (err) {
                console.error("Result not in Database or other issue: " + err.message);
                reject(err);
                return;
            }
            resolve(row);
        });
    });
}

// Function to check if an outcome already exists in the database
// Returns true if it exists, false if it does not
function checkIfOutcomeExists(key) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM messages WHERE id = ?", [key], (err, row) => {
            if (err) {
                console.error(err.message);
                reject(err);
                return;
            }
            if(row){ resolve(true); } else { resolve(false); }
        });
    });
}