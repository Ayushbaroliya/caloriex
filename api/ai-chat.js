import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Add CORS headers so your frontend can talk to the backend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { conversationHistory } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Format history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }));

    const chat = model.startChat({ history: history.slice(0, -1) });
    const lastMessage = history[history.length - 1].parts[0].text;

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ candidates: [{ content: { parts: [{ text }] } }] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Error', details: error.message });
  }
}