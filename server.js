import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Root Route: Serve index.html
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "public" });
});

// Route: Search Food
app.get("/api/search-food", async (req, res) => {
    const { query } = req.query;
    const API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

    if (!query) {
        return res.status(400).json({ error: "Query required" });
    }

    try {
        const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
                query
            )}&pageSize=1&api_key=${API_KEY}`
        );

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "USDA API Error" });
    }
});

// Route: Generate Meal Plan
app.post("/api/generate-meal-plan", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "models/gemini-flash-latest"
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        res.status(200).json({
            candidates: [
                {
                    content: {
                        parts: [{ text }]
                    }
                }
            ]
        });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Generation Error" });
    }
});

// Route: AI Chat
app.post("/api/ai-chat", async (req, res) => {
    const { conversationHistory } = req.body;

    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        return res.status(400).json({ error: "conversationHistory is required" });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "models/gemini-flash-latest"
        });

        const history = conversationHistory.map(msg => ({
            role: msg.role,
            parts: msg.parts
        }));

        const chat = model.startChat({
            history: history.slice(0, -1)
        });

        const lastMessage = history.at(-1)?.parts?.[0]?.text;

        if (!lastMessage) {
            return res.status(400).json({ error: "Last message is empty" });
        }

        const result = await chat.sendMessage(lastMessage);
        const text = result.response.text();

        res.status(200).json({
            candidates: [
                {
                    content: {
                        parts: [{ text }]
                    }
                }
            ]
        });

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({
            error: "AI Error",
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
