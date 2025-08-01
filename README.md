# Cardvantage 💳
![Cardvantage Logo](https://github.com/KhangHo10/Cardvantage/blob/main/front-end/icons/Logo.png)

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Chrome](https://img.shields.io/badge/Google_Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E77EE?style=for-the-badge&logo=google&logoColor=white)

An intelligent Chrome extension that uses AI to tell you the best credit card to use for any online purchase.

---

## Inspiration

Credit card reward programs are designed to be complex. With dozens of cards offering different multipliers for various categories like dining, travel, or groceries, it's nearly impossible for the average person to know which card to use for a specific purchase to maximize their rewards. This confusion leads to "analysis paralysis" and, ultimately, lost value. Cardvantage was inspired by the need to bring simplicity and clarity to this problem, empowering users to make the smartest financial decision with zero effort.

## What It Does

Cardvantage is a seamless Chrome extension that acts as a personal financial assistant. The user experience is simple:

1.  **Sign In:** Users securely sign in with their Google account.
2.  **Add Cards:** Users add the names of the credit cards they own to their personal "wallet" inside the extension.
3.  **Get Recommendations:** When shopping on any website, the user can click the "Get Recommendation" button. The extension sends the current website's domain and the user's list of cards to our AI-powered backend.
4.  **Receive Instant Advice:** The backend uses the Google Gemini API to analyze the merchant's category and the user's cards, instantly returning a recommendation for the single best card to use for that purchase, along with the reason why.

To ensure a fast and smooth experience, the extension uses a smart caching system that stores recommendations for previously visited sites, only clearing the cache when the user's list of cards changes.

## How We Built It

The project is a full-stack application composed of a Chrome extension frontend and a Node.js backend.

### Frontend

The frontend is a Chrome extension built with **HTML, CSS, and vanilla JavaScript** to keep it lightweight and fast. We leveraged the **`chrome.identity` API** for secure Google Sign-In and the **`chrome.storage.local` API** to persist the user's list of cards. The core feature is a smart caching system built directly into the front-end, which checks for a valid, existing recommendation before making a `fetch` call to the backend. This ensures instantaneous responses for repeat website visits and automatically invalidates the cache when a user adds or deletes a card.

### Backend

The backend is a lightweight server built with **Node.js** and the **Express.js** framework. It exposes a single RESTful API endpoint (`/api/get-recommendation`) that accepts a website URL and a list of the user's cards. The core logic resides in a carefully engineered prompt sent to the **Google Gemini API** via the `@google/generative-ai` SDK. To ensure consistent and reliable responses, we configured the API call with a `temperature` of 0. Secret API keys are managed securely using the `dotenv` package.

## Setup and Installation

Follow these steps to set up and run the project locally.

### Prerequisites

* **Node.js** (v18 or later)
* **Google Chrome**

### Frontend Setup

1.  Navigate to the `front-end` directory.
2.  Input your Google OAuth2 Client ID into the `manifest.json` file on line 12:

    ```json
    "client_id": "YOUR_CLIENT_ID",
    ```

3.  Open Google Chrome and navigate to `chrome://extensions`.
4.  Enable "Developer mode" in the top-right corner.
5.  Click "Load unpacked" and select the `front-end` folder.

### Backend Setup

1.  Navigate to the `back-end` directory:
    ```bash
    cd back-end
    ```

2.  Create a `.env` file and add your Gemini API Key on the first line:
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  Install the necessary npm packages:
    ```bash
    npm install
    ```

4.  Start the backend development server:
    ```bash
    npm run start:dev
    ```
    The server will be available at `http://localhost:8080`.

## What's Next for Cardvantage

* **Server side caching:** Connect to MongoDB or SQLite to enable server side caching, eliminating the risk of cache being lost due to local resets.
* **Savings tracking:** Track total savings over time and display with a visual (e.g. a growing tree) to show the user how much they have saved and encourage continued savings.
* **Integration with budgeting tools:** Integrating with budgeting tools like Rocket Money and Honeydue to get a wider audience saving on credit rewards.
* **Developing into an app:** After connecting to databases and running server side caching, we can then connect Cardvantage into a mobile app to give users savings on mobile shopping as well.

## Contributors
Ethan Ma
Abel Addis
Khang Ho
Jenny Suwanchote
Tianyi Shao
