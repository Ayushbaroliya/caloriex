import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ======================
// Groq Setup (Free API)
// ======================
if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY missing in environment variables");
    process.exit(1);
}

// ======================
// Helper: Convert Gemini → Groq format
// ======================
function convertGeminiHistoryToGroq(history) {
    return history.map(msg => ({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.parts?.[0]?.text || ""
    }));
}

// ======================
// Routes
// ======================

// Home
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "public" });
});

// Static Pages
app.get("/bmi", (req, res) => {
    res.sendFile("bmi.html", { root: "public" });
});

app.get("/ai-nutritionist", (req, res) => {
    res.sendFile("ai-nutritionist.html", { root: "public" });
});

app.get("/dietPlan", (req, res) => {
    res.sendFile("dietPlan.html", { root: "public" });
});

// ======================
// USDA Food Search API
// ======================
app.get("/api/search-food", async (req, res) => {
    const { query } = req.query;
    const API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

    if (!query) return res.status(400).json({ error: "Query required" });

    try {
        const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1&api_key=${API_KEY}`
        );

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("USDA API Error:", error);
        res.status(500).json({ error: "USDA API Error" });
    }
});

// ======================
// Generate Meal Plan (Groq AI)
// ======================
app.post("/api/generate-meal-plan", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!data.choices) {
            console.error("Groq API Error:", data);
            return res.status(500).json({ error: "Groq API Error", details: data });
        }

        const text = data.choices[0].message.content;

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
        console.error("Groq Error:", error);
        res.status(500).json({ error: "Generation Error", details: error.message });
    }
});

// ======================
// AI Chat (Gemini Frontend → Groq Backend)
// ======================
app.post("/api/ai-chat", async (req, res) => {
    const { conversationHistory } = req.body;

    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        return res.status(400).json({ error: "conversationHistory is required" });
    }

    try {
        const groqMessages = convertGeminiHistoryToGroq(conversationHistory);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: groqMessages
            })
        });

        const data = await response.json();

        if (!data.choices) {
            console.error("Groq API Error:", data);
            return res.status(500).json({ error: "Groq API Error", details: data });
        }

        const text = data.choices[0].message.content;

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
        console.error("Groq Chat Error:", error);
        res.status(500).json({ error: "AI Error", details: error.message });
    }
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
