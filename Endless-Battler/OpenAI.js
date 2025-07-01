// Handles the OpenAI API calls for determining the winner of battles, providing victory reasons, and selecting emojis. All done with the GPT-4o-mini model.
// Requires the OpenAI API key to be set in the environment variables as OPENAI_API_KEY.

import OpenAI from "openai"
import dotenv from 'dotenv';
dotenv.config();

const openAIKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: openAIKey,
})

// Determine the winner of a battle between two participants. 
// "Attacker" is the name of the participant that the user put in, the "Defender" is either the starting foe or the last winner.
export async function determineWinner(attacker, defender) {
    try {
    const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: `Resolve the battle between the Attacker: "${attacker}". 
    And the Defender: "${defender}". 
    Determine who wins between the two, consider all factors. If the attacker is something which doesn't make sense, like a string of random characters, ensure that they lose. 
    If either participant is a character from a movie, book, or game, ensure that they are in character and use their abilities.
    Decide who wins and respond with ONLY the name of the winner as given to you within the quotation marks. Do not alter the name in any way or add any other text.
    Remove the quotation marks from the name of the winner.`,
    temperature: 0.7,
});
    console.log(response.output_text);
    return response.output_text;
    } catch (error) {
        console.error("Error determining winner:", error);
        return null;
    }
}

// Provides a reason for the victory. Is called only *after* the determineWinner function. 
// The Winner must be passed to this function otherwise the AI may decide on a different winner than it did in the determineWinner function.
export async function victoryReason(attacker, defender, winner) {
    try {
    const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: `There was a battle between ${attacker} and ${defender}. The winner was ${winner}.
    Explain how ${winner} won the battle in a single sentence. Be snarky and playful with your response.`,
    temperature: 1.0,
});
    console.log(response.output_text);
    return response.output_text;
    } catch (error) {
        console.error("Error determining winner:", error);
        return null;
    }
}

// Choose an emoji that best represents the winner of the battle
export async function getEmoji(prompt) {
    try {
    const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: "Select an emoji that best represents the following text: " + prompt + ". Respond with only the emoji.",
    temperature: 0.5,
    });
    console.log(response.output_text);
    return response.output_text;
    } catch (error) {
        console.error("Error determining winner:", error);
        return null;
    }
}