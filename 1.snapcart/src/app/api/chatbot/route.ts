import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ reply: "Chatbot is temporarily offline (Missing API Key)." }, { status: 200 });
        }

        const prompt = "You are 'GrocyBot', a helpful AI shopping assistant for SnapCart grocery delivery app. Context: The user is browsing the app or checking their order. Guidelines: 1. Keep responses short and friendly. 2. Help with finding products, order status, or delivery issues. 3. If you don't know something about a specific live order, ask them to check 'My Orders'. 4. Use emojis. Recent conversation: " + 
        history.map((h: any) => (h.role === 'bot' ? 'Assistant: ' : 'User: ') + h.text).join('\n') + 
        "\nUser: " + message + "\nAssistant:";

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": prompt }] }]
            })
        });

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that, but I'm here to help!";

        return NextResponse.json({ reply: reply.trim() }, { status: 200 });

    } catch (error) {
        console.error("Chatbot API error:", error);
        return NextResponse.json({ reply: "Oops! My brain is a bit foggy. Can you try again?" }, { status: 200 });
    }
}
