"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ApiPayload, ApiResponse, Message } from "@/types/api";
import { SubscriptionService, AccessControl } from "@/lib/subscriptionService";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "../../types/api";

const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 9);

// Generate secure, personalized referral key
const generateReferralKey = (userEmail: string) => {
  const emailHash = btoa(userEmail).slice(0, 8).replace(/[^a-zA-Z0-9]/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).slice(-4);
  return `DV-${emailHash}-${randomPart}-${timestamp}`;
};

// Inline styles (keeps working without Tailwind)
const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "flex",
    height: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    background: "#F7F7FA",
  },
  sidebar: {
    width: 300,
    background: "linear-gradient(180deg,#EDEAFF 0%,#F7F6FF 100%)",
    borderRight: "1px solid rgba(0,0,0,0.06)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  logoImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(75,60,188,0.12)",
    objectFit: "cover",
  },
  logoText: { fontSize: 18, fontWeight: 700, color: "#2B2B2B" },
  topButtons: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 },
  buttonPrimary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(75,60,188,0.12)",
  },
  askButton: { background: "#007AFF", color: "white" },
  sermonButton: { background: "#34C759", color: "white" },
  pptxButton: { background: "#8E6AFF", color: "white" },
  chatsContainer: { marginTop: 8, overflowY: "auto", flex: 1, paddingRight: 6 },
  chatItem: {
    padding: "10px 12px",
    background: "white",
    borderRadius: 10,
    marginBottom: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    cursor: "pointer",
    fontSize: 13,
    color: "#222",
  },
  profileBox: {
    marginTop: 12,
    padding: 12,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 8px 18px rgba(31,31,31,0.04)",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", background: "white" },
  header: {
    padding: "22px 28px",
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conversationArea: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    background: "#007AFF",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 16,
    maxWidth: "80%",
    fontSize: 14,
    textAlign: "justify",
  },
  bubbleAI: {
    alignSelf: "flex-start",
    background: "#F1F3F8",
    color: "#111",
    padding: "10px 14px",
    borderRadius: 16,
    maxWidth: "80%",
    fontSize: 14,
    textAlign: "justify",
  },
  footer: {
    padding: 18,
    borderTop: "1px solid rgba(0,0,0,0.04)",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.08)",
    outline: "none",
    fontSize: 15,
  },
  sendButton: {
    padding: "10px 16px",
    borderRadius: 14,
    border: "none",
    background: "#007AFF",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  suggestedWrap: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  suggestedBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  slidePanel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: 350,
    height: "100vh",
    background: "white",
    boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
    zIndex: 1000,
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
    padding: 24,
    overflowY: "auto",
  },
  slidePanelActive: {
    transform: "translateX(0)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#333",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#666",
    padding: 4,
  },
  panelSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#333",
    marginBottom: 12,
  },
  profileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  },
  profileLabel: {
    fontWeight: 500,
    color: "#666",
  },
  profileValue: {
    fontWeight: 600,
    color: "#333",
  },
  referralItem: {
    background: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logoutButton: {
    width: "100%",
    padding: "14px",
    background: "#DC3545",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 24,
  },
  upgradeFeature: {
    background: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  upgradePrice: {
    fontSize: 24,
    fontWeight: 700,
    color: "#4B3CBC",
    marginBottom: 8,
  },
  upgradeButton: {
    width: "100%",
    padding: "14px",
    background: "#34C759",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
};

export default function ChatPage() {
  const [mode, setMode] = useState<"ask" | "sermon" | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userText, setUserText] = useState("");
  const [loading, setLoading] = useState(false);
  const [promptQueue, setPromptQueue] = useState<string[]>([]);
  const [pptxReady, setPptxReady] = useState(false);
  const [conversations, setConversations] = useState<{id: string, title: string, messages: Message[]}[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const convRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('deepverse_conversations');
    if (saved) {
      setConversations(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('deepverse_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (convRef.current) convRef.current.scrollTop = convRef.current.scrollHeight + 200;
  }, [messages, promptQueue]);

  // Check authentication and subscription access on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Get user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        window.location.href = '/login';
        return;
      }

      const userData = userDocSnap.data() as User;

      // Check subscription access
      const accessLevel = await SubscriptionService.getAccessLevel(user.email || '');
      if (accessLevel === 'free') {
        window.location.href = '/upgrade';
        return;
      }

      if (accessLevel === 'pending') {
        alert('Your payment is being processed. You will have full access once payment is confirmed.');
      }

      // Check for expiration notifications
      const expirationCheck = await SubscriptionService.checkExpirationAndNotify(user.email || '');
      if (expirationCheck.shouldNotify) {
        alert(`Your subscription expires in ${expirationCheck.daysUntilExpiry} days. Please renew to avoid service interruption.`);
      }
    });

    return () => unsubscribe();
  }, []);

  const initialAskPrompt = "What theological or Bible question would you like answered?";
  const initialSermonPrompt = "What passage would you like to study? (e.g., John 3:16)";

  const startAIInteraction = (selectedMode: "ask" | "sermon") => {
    const initial: Message = { id: uid("a_"), role: "ai", text: selectedMode === "ask" ? initialAskPrompt : initialSermonPrompt };
    const newConv = { id: uid('conv_'), title: selectedMode === 'sermon' ? 'Sermon Study' : 'Question Study', messages: [initial] };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setMessages(newConv.messages);
    setMode(selectedMode);
    setPromptQueue(selectedMode === "sermon" ? [initialSermonPrompt] : []);
  };

  // typed postToAPI
  const postToAPI = async (payload: ApiPayload): Promise<ApiResponse> => {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If response is PPTX (arraybuffer), return a minimal success object
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("presentation")) {
        // return special marker so caller handles binary
        const arrayBuffer = await res.arrayBuffer();
        return { binary: arrayBuffer };
      }

      if (!res.ok) {
        const txt = await res.text();
        console.error("AI API error:", txt);
        return { text: "AI service error" };
      }

      const data = (await res.json()) as ApiResponse;
      return data;
    } catch (err) {
      console.error("Network error:", err);
      return { text: "Network error: could not reach AI" };
    }
  };

  const handleUserSubmit = async (overrideText?: string) => {
    if (!mode) {
      startAIInteraction("ask");
      return;
    }

    const input = (overrideText ?? userText).trim();
    if (!input) return;

    const userMsg: Message = { id: uid("u_"), role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setUserText("");
    setLoading(true);

    const payload: ApiPayload = {
      mode,
      message: input,
      context: messages.map((m) => `${m.role}: ${m.text}`),
      messages,
    };

    const aiRes = await postToAPI(payload);

    // If binary pptx returned (for safety, we handle in UI but normally '/api/ai' will return JSON)
    if ('binary' in aiRes && aiRes.binary) {
      // create link from binary
      const arr = aiRes.binary as ArrayBuffer;
      const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DeepVerse_Sermon.pptx";
      a.click();
      URL.revokeObjectURL(url);
      setLoading(false);
      return;
    }

    const aiText = aiRes.text ?? "DeepVerse could not generate a reply.";
    const aiMsg: Message = { id: uid("a_"), role: "ai", text: aiText };
    setMessages((prev) => [...prev, aiMsg]);

    if (currentConversationId) {

      const updatedMessages = [...messages, userMsg, aiMsg];

      setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, messages: updatedMessages } : c));

      // update title if first user message

      const userMsgs = updatedMessages.filter(m => m.role === 'user');

      if (userMsgs.length === 1) {

        const newTitle = mode === 'sermon' ? `Sermon on ${input}` : `Question: ${input.slice(0,50)}...`;

        setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, title: newTitle } : c));

      }

    }

    // suggested prompt handling
    if (mode === "sermon" && aiRes.suggestedPrompt) setPromptQueue([aiRes.suggestedPrompt]);
    else setPromptQueue([]);

    setPptxReady(aiRes.pptxReady || false);

    setLoading(false);
  };

  const handlePromptClick = (p: string) => {
    // clicking a suggested prompt sends it as user's input
    handleUserSubmit(p);
  };

  const handleDownloadPPTX = async () => {
    if (!mode) setMode("sermon");
    // call API with pptx mode; server will return binary
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "pptx", messages }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("PPTX generation failed:", txt);
        alert("PPTX generation failed. See console.");
        setLoading(false);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DeepVerse_Sermon.pptx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PPTX. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatItemClick = (m: Message) => setUserText(m.text);

  const subscribed = process.env.NEXT_PUBLIC_SUBSCRIBED === "true";
  const userRole = process.env.NEXT_PUBLIC_USER_EMAIL === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : process.env.NEXT_PUBLIC_USER_EMAIL === process.env.NEXT_PUBLIC_DEMO_EMAIL ? 'demo' : subscribed ? 'subscriber' : 'free';

  const referralKey = generateReferralKey(process.env.NEXT_PUBLIC_USER_EMAIL || "user@example.com");
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${referralKey}` : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    alert('Referral link copied to clipboard!');
  };

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoRow}>
            <img
              src="/deepverse.logo.png"
              alt="logo"
              style={styles.logoImg}
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/deepverse.logo.png")}
            />
            <div style={styles.logoText}>DeepVerse AI</div>
          </div>

          <div style={styles.topButtons}>
            <button style={{ ...styles.buttonPrimary, ...styles.askButton }} onClick={() => startAIInteraction("ask")}>
              Ask a Question
            </button>

            <button style={{ ...styles.buttonPrimary, ...styles.sermonButton }} onClick={() => startAIInteraction("sermon")}>
              Generate Sermon
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 700, color: "#333" }}>Your Chats</div>
            <div style={styles.chatsContainer}>
              {conversations.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>No conversations yet.</div>}

              {conversations.map((conv) => (
                <div key={conv.id} style={styles.chatItem} onClick={() => {
                  setCurrentConversationId(conv.id);
                  setMessages(conv.messages);
                  setMode(conv.title.includes('Sermon') ? 'sermon' : 'ask');
                  setPromptQueue([]);
                  setPptxReady(false);
                }}>
                  {conv.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.profileBox}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setShowProfilePanel(true)}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#EAEAFD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#4B3CBC",
              }}
            >
              EA
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#222" }}>
                {process.env.NEXT_PUBLIC_USER_EMAIL === 'kerux.ai.io@gmail.com'
                  ? 'Admin'
                  : (process.env.NEXT_PUBLIC_USER_NAME || "Guest User")}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "none", background: subscribed ? "#D1E7DD" : "#FFD580", cursor: "pointer", fontWeight: 700 }}
              onClick={() => { if (!subscribed) setShowUpgradePanel(true); }}
            >
              {subscribed ? "Subscribed" : "Upgrade"}
            </button>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: "#222" }}>{mode === "sermon" ? "Sermon Guide" : "Ask a Question"}</h3>
            <div style={{ fontSize: 13, color: "#666" }}>{mode ? `Mode: ${mode}` : "Mode: not selected"}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", background: "white", cursor: "pointer", fontWeight: 600 }} onClick={() => { if (!confirm("Clear this conversation?")) return; setConversations(prev => prev.filter(c => c.id !== currentConversationId)); setMessages([]); setPromptQueue([]); setPptxReady(false); setMode(null); setCurrentConversationId(null); }}>
              Clear
            </button>
            <div style={{ color: "#666", fontSize: 13 }}>DeepVerse AI</div>
          </div>
        </div>

        <div ref={convRef} style={styles.conversationArea}>
          {messages.length === 0 && <div style={{ color: "#666", fontSize: 14 }}>Welcome to DeepVerse AI — select Ask a Question or Generate Sermon to begin.</div>}

          {messages.map((m) => (
            <div key={m.id} style={m.role === "user" ? styles.bubbleUser : styles.bubbleAI}>{m.text}</div>
          ))}

          {promptQueue.length > 0 && (
            <div style={styles.suggestedWrap}>
              {promptQueue.map((p, i) => (
                <button key={i} style={styles.suggestedBtn} onClick={() => handlePromptClick(p)}>{p}</button>
              ))}
            </div>
          )}

          {pptxReady && (
            <div style={styles.suggestedWrap}>
              <button style={styles.suggestedBtn} onClick={() => handleDownloadPPTX()}>Download PPTX</button>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <input
            aria-label="Message input"
            style={styles.input}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUserSubmit();
              }
            }}
            placeholder={mode === "sermon" ? "Answer the current exegetical question or type an insight..." : "Type your theological question..."}
            disabled={loading}
          />

          <button style={styles.sendButton} onClick={() => handleUserSubmit()} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </main>

      {/* Upgrade Panel */}
      {showUpgradePanel && (
        <>
          <div style={styles.overlay} onClick={() => setShowUpgradePanel(false)} />
          <div style={{ ...styles.slidePanel, ...(showUpgradePanel ? styles.slidePanelActive : {}) }}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Upgrade to Premium</h2>
              <button style={styles.closeButton} onClick={() => setShowUpgradePanel(false)}>×</button>
            </div>

            <div style={styles.panelSection}>
              <div style={styles.upgradePrice}>₱299/month</div>
              <p style={{ color: "#666", marginBottom: 20 }}>
                Unlock unlimited access to DeepVerse AI's advanced theological insights and sermon generation tools.
              </p>
            </div>

            <div style={styles.panelSection}>
              <h3 style={styles.sectionTitle}>Premium Features</h3>
              <div style={styles.upgradeFeature}>
                <strong>✓ Unlimited AI Conversations</strong><br />
                Ask unlimited theological questions and receive seminary-level insights
              </div>
              <div style={styles.upgradeFeature}>
                <strong>✓ Advanced Sermon Generation</strong><br />
                Complete exegetical-hermeneutical study with professional PPTX output
              </div>
              <div style={styles.upgradeFeature}>
                <strong>✓ Priority Support</strong><br />
                Direct access to theological experts and AI specialists
              </div>
              <div style={styles.upgradeFeature}>
                <strong>✓ Referral Program</strong><br />
                Earn 10% monthly bonus for each active referral (unlimited referrals)
              </div>
            </div>

            <button style={styles.upgradeButton} onClick={() => alert('Payment integration coming soon!')}>
              Subscribe Now - ₱299/month
            </button>
          </div>
        </>
      )}

      {/* Profile Panel */}
      {showProfilePanel && (
        <>
          <div style={styles.overlay} onClick={() => setShowProfilePanel(false)} />
          <div style={{ ...styles.slidePanel, ...(showProfilePanel ? styles.slidePanelActive : {}) }}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Profile Dashboard</h2>
              <button style={styles.closeButton} onClick={() => setShowProfilePanel(false)}>×</button>
            </div>

            <div style={styles.panelSection}>
              <h3 style={styles.sectionTitle}>Account Information</h3>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Full Name:</span>
                <span style={styles.profileValue}>
                  {process.env.NEXT_PUBLIC_USER_EMAIL === 'kerux.ai.io@gmail.com'
                    ? 'Admin'
                    : (process.env.NEXT_PUBLIC_USER_NAME || "Guest User")}
                </span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Email:</span>
                <span style={styles.profileValue}>{process.env.NEXT_PUBLIC_USER_EMAIL || "user@example.com"}</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Role:</span>
                <span style={styles.profileValue}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Subscription Status:</span>
                <span style={styles.profileValue}>{subscribed ? "Active" : "Free"}</span>
              </div>
              {subscribed && (
                <div style={styles.profileItem}>
                  <span style={styles.profileLabel}>Renewal Date:</span>
                  <span style={styles.profileValue}>Dec 28, 2025</span>
                </div>
              )}
            </div>

            <div style={styles.panelSection}>
              <h3 style={styles.sectionTitle}>Referral Program</h3>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Your Referral Key:</span>
                <span style={styles.profileValue}>{referralKey}</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Referral Link:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...styles.profileValue, fontSize: 12, wordBreak: "break-all" }}>{referralUrl}</span>
                  <button
                    style={{
                      padding: "4px 8px",
                      background: "#007AFF",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 10,
                      cursor: "pointer"
                    }}
                    onClick={copyReferralLink}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Active Referrals:</span>
                <span style={styles.profileValue}>0</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Total Bonus Earned:</span>
                <span style={styles.profileValue}>₱0.00</span>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: "#E8F5E8", borderRadius: 8, border: "1px solid #4CAF50" }}>
                <strong>How Referral Program Works:</strong><br />
                Share your referral link with others. When someone clicks your link and signs up for a subscription, you earn 10% monthly bonus of ₱299 (₱29.90/month per referral). There are no limits on active referral bonuses per subscriber.
              </div>
            </div>

            <button style={styles.logoutButton} onClick={async () => {
              if (confirm('Are you sure you want to log out?')) {
                await signOut(auth);
                window.location.href = '/login';
              }
            }}>
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
