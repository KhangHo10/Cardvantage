require('dotenv').config(); // Loads environment variables from the .env file
const express = require('express');
const app = express();
const PORT = 8080;
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get API key from env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("API Key not found");
  process.exit(1); 
}

// Initialize the API and set the model of gemini to be used. Gemini 2.5 Flash is compatible and has best accuracy from testing
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    response_mime_type: "application/json", // This forces the output to be a JSON
  },
});

app.use(cors());
app.use(express.json());

app.post('/api/get-recommendation', async (req, res) => {
  const { websiteUrl, userCards } = req.body;

  if (!websiteUrl || !userCards) {
    return res.status(400).json({ error: 'Missing URL or cards in request body.' });
  }

  const prompt = `
    You are a financial assistant expert in credit card rewards. Your goal is to help a user choose the best credit cards for a purchase.

    Analyze the provided website URL to determine the merchant's spending category (e.g., "Dining", "Travel", "Groceries", "Online Shopping", etc.).

    Then, review the user's list of credit cards. Each card is an object with a "name." Select the top 1-3 cards that offer the highest reward rates for the inferred category. If multiple cards are equally good, include them all (up to 3 maximum).

    Here is the information:
    - Website URL: "${websiteUrl}"
    - User's Credit Cards: ${JSON.stringify(userCards)}

    Your response must be a valid JSON object with the following structure:
    {
      "category": "The spending category (e.g., 'Dining', 'Travel')",
      "recommendations": [
        {
          "cardName": "Exact card name from user's list",
          "reason": "Detailed explanation of why this card is recommended for this category",
          "rewardRate": "The reward rate or benefit (e.g., '2% cashback', '3x points')"
        }
      ]
    }

    Rules:
    - Only recommend cards from the user's provided list
    - Include 1-3 cards maximum
    - If only one card is clearly best, return just that one
    - If multiple cards are close in value, include up to 3
    - Provide specific reward rates when possible
    - Keep reasons concise but informative (1-2 sentences)
  `;

  // Call the AI and return the response
  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const responseObject = JSON.parse(responseText);

    console.log("AI Recommendation:", responseObject);
    res.status(200).json(responseObject);

  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    res.status(500).json({ error: "Failed to process request with the AI model." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});