import { useState, useRef, useEffect } from "react";
import { PageLayout } from "./Layout";
import { useAuthStore } from "./Authstore";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const CAMPUS_CONTEXT = `You are RideSync AI, an intelligent assistant for a real-time campus ride management platform. 
You help passengers and drivers with:
- Suggesting best pickup locations on campus
- Predicting ride demand and wait times  
- Campus navigation tips
- Ride booking advice
- Driver tips for best routes and peak hours
- General campus mobility questions
- Demand forecasting and analytics insights
Be concise, friendly and helpful. Give specific, actionable advice.`;

const QUICK_PROMPTS = [
  "Where's the best pickup spot near the library?",
  "When is peak demand on campus?",
  "Best route from Main Gate to Hostel Zone?",
  "How do I get a ride quickly during class hours?",
  "Which areas have most ride requests?",
  "Tips for drivers during exam season?",
];

export default function AIAssistant() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your RideSync AI assistant. I can help you with ride suggestions, campus navigation, demand forecasting, and more. What would you like to know?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMessage = { role: "user", content: msg };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const allMessages = [...messages, userMessage];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          messages: [
            { role: "system", content: CAMPUS_CONTEXT },
            ...allMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const data = await res.json();

      if (data.choices && data.choices[0]) {
        const reply = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      } else {
        console.error("Groq error full:", JSON.stringify(data));
        setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please check your connection and try again." }]);
    }

    setLoading(false);
  };

  return (
    <PageLayout title="AI Assistant">
      <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>

        {/* Header card */}
        <div style={{ background: "linear-gradient(135deg,rgba(0,239,255,0.08),rgba(0,255,153,0.08))", border: "1px solid rgba(0,239,255,0.15)", borderRadius: 14, padding: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#00efff,#00ff99)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤖</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>RideSync AI</div>
            <div style={{ fontSize: 12, color: "#8a92a8", marginTop: 2 }}>Powered by Groq · Llama 3 · Campus-aware intelligence</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#00ff99" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff99", animation: "pulseDot 2s infinite" }} />
            Online
          </div>
        </div>

        {/* Quick prompts */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
          {QUICK_PROMPTS.slice(0, 3).map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              style={{ padding: "5px 12px", background: "rgba(0,239,255,0.06)", border: "1px solid rgba(0,239,255,0.15)", borderRadius: 20, color: "#00efff", fontSize: 12, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}>
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: "1rem" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#00efff,#00ff99)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: "75%", padding: "10px 14px",
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: m.role === "user" ? "rgba(0,239,255,0.12)" : "#151824",
                border: `1px solid ${m.role === "user" ? "rgba(0,239,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                fontSize: 14, lineHeight: 1.6, color: "#e8eaf0", whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1c2130", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {user?.role === "driver" ? "🛺" : "🎓"}
                </div>
              )}
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#00efff,#00ff99)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "#151824", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8a92a8", animation: `bounce 1s ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ display: "flex", gap: 10, padding: "1rem 0 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about campus rides, locations, demand forecasting..."
            style={{ flex: 1, padding: "12px 16px", background: "#151824", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#e8eaf0", fontFamily: "DM Sans,sans-serif", fontSize: 14, outline: "none" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ padding: "12px 24px", background: loading || !input.trim() ? "#1c2130" : "#00efff", border: "none", borderRadius: 12, color: loading || !input.trim() ? "#4a5168" : "#000", fontWeight: 700, fontSize: 14, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all .2s", whiteSpace: "nowrap" }}>
            {loading ? "..." : "Send ↑"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 
          0%, 60%, 100% { transform: translateY(0); } 
          30% { transform: translateY(-6px); } 
        }
      `}</style>
    </PageLayout>
  );
}