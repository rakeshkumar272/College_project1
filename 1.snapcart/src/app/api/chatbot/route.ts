import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ reply: "GrocyBot is temporarily offline. Please try again later! 🛒" }, { status: 200 });
        }

        const systemPrompt = `You are 'GrocyBot', the official AI assistant for SnapCart. 
Your goal is to provide fast, friendly, and helpful support to grocery shoppers.

RESPONSIBILITIES:
1. 📦 Order Problems: If users ask about order status or delays, advise them to check 'My Orders' for real-time tracking. Mention that SnapCart aims for 10-minute delivery.
2. 🛒 Cart Help: Guide users on how to add/remove items or change quantities if they are stuck.
3. 💳 Payment Problems: For failed payments or refund queries, reassure them that money is safe and suggest checking their bank or contacting support if not resolved in 24 hours.
4. 🚚 Delivery Help: If they ask about delivery partner location, tell them to use the 'Track Order' feature on their active order.
5. 🧾 Product Info: Provide general advice on grocery freshness, stock, and finding the best deals.

RULES:
- Be concise (2-3 sentences max).
- Always use emojis 🛒📦🚚🥦.
- If you don't know a specific detail (like a private user ID), politely ask them to look at their dashboard.
- Personality: Energetic, polite, and obsessed with fresh groceries.

Current Conversation History:
${history.map((h: any) => (h.role === 'bot' ? 'Assistant' : 'User') + ': ' + h.text).join('\n')}
User: ${message}
Assistant:`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": systemPrompt }] }]
            })
        });

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help! Could you please rephrase that? 🛒";

        return NextResponse.json({ reply: reply.trim() }, { status: 200 });

    } catch (error) {
        console.error("Chatbot API error:", error);
        return NextResponse.json({ reply: "Sorry, I'm feeling a bit sleepy. Can we try that again? 😴🛒" }, { status: 200 });
    }
}
