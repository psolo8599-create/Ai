"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type Msg = {
  role: Role;
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: Msg[];
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function shortTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New Chat";
  return clean.length > 24 ? clean.slice(0, 24) + "..." : clean;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeId) || null;
  }, [sessions, activeId]);

  // load sessions
  useEffect(() => {
    const saved = localStorage.getItem("xtrom_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveId(parsed[0].id);
          return;
        }
      } catch {}
    }

    // default session
    const first: ChatSession = {
      id: uid(),
      title: "XTROM AI",
      createdAt: Date.now(),
      messages: [
        {
          role: "assistant",
          content:
            "XTROM AI ONLINE.\n\nMode: Coding + Debugging + Vision.\n\nKirim error log / kode / screenshot."
        }
      ]
    };

    setSessions([first]);
    setActiveId(first.id);
  }, []);

  // save sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("xtrom_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // auto scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [activeSession?.messages, loading]);

  function newChat() {
    const session: ChatSession = {
      id: uid(),
      title: "New Chat",
      createdAt: Date.now(),
      messages: [
        {
          role: "assistant",
          content:
            "XTROM AI siap.\n\nKirim error log / kode / screenshot untuk debugging."
        }
      ]
    };

    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setInput("");
    setImageBase64(null);
    setImagePreview(null);
  }

  function deleteChat(id: string) {
    const filtered = sessions.filter((s) => s.id !== id);

    if (filtered.length === 0) {
      localStorage.removeItem("xtrom_sessions");
      window.location.reload();
      return;
    }

    setSessions(filtered);

    if (activeId === id) {
      setActiveId(filtered[0].id);
    }
  }

  function switchChat(id: string) {
    setActiveId(id);
    setInput("");
    setImageBase64(null);
    setImagePreview(null);
  }

  function clearActiveChat() {
    if (!activeSession) return;

    const resetMessages: Msg[] = [
      {
        role: "assistant",
        content:
          "XTROM AI reset.\n\nKirim error log / kode / screenshot untuk analisis."
      }
    ];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, messages: resetMessages } : s
      )
    );

    setInput("");
    setImageBase64(null);
    setImagePreview(null);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus gambar!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageBase64(null);
    setImagePreview(null);
  }

  async function sendMessage() {
    if (!activeSession) return;
    if ((!input.trim() && !imageBase64) || loading) return;

    const userText = input.trim();

    const userMsgText = imageBase64
      ? `🖼️ [Image/Screenshot]\n${userText || "(tanpa teks)"}`
      : userText;

    const newMessages: Msg[] = [
      ...activeSession.messages,
      { role: "user", content: userMsgText }
    ];

    // auto title update
    const newTitle =
      activeSession.title === "New Chat" && userText
        ? shortTitle(userText)
        : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, title: newTitle, messages: newMessages }
          : s
      )
    );

    setInput("");
    setLoading(true);

    const history = newMessages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          imageBase64: imageBase64,
          history: history
        })
      });

      const data = await res.json();

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [
                  ...newMessages,
                  {
                    role: "assistant",
                    content: data.reply || "❌ Tidak ada respon."
                  }
                ]
              }
            : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [
                  ...newMessages,
                  {
                    role: "assistant",
                    content: "❌ Error server / API key salah."
                  }
                ]
              }
            : s
        )
      );
    }

    setLoading(false);
    setImageBase64(null);
    setImagePreview(null);
  }

  return (
    <main style={styles.wrap}>
      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? "270px" : "0px",
          padding: sidebarOpen ? "16px" : "0px"
        }}
      >
        {sidebarOpen && (
          <>
            <div style={styles.brand}>
              <div style={styles.brandOrb}></div>
              <div>
                <div style={styles.brandName}>XTROM</div>
                <div style={styles.brandTag}>Red Coding AI</div>
              </div>
            </div>

            <button style={styles.newChatBtn} onClick={newChat}>
              + New Chat
            </button>

            <div style={styles.chatList}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    ...styles.chatItem,
                    ...(s.id === activeId ? styles.chatItemActive : {})
                  }}
                  onClick={() => switchChat(s.id)}
                >
                  <div style={styles.chatTitle}>{s.title}</div>
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(s.id);
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>

            <button style={styles.clearBtn} onClick={clearActiveChat}>
              Clear Current Chat
            </button>

            <div style={styles.sidebarFooter}>
              XTROM AI • Multi Chat • LocalStorage
            </div>
          </>
        )}
      </aside>

      {/* MAIN */}
      <section style={styles.main}>
        <header style={styles.topBar}>
          <button
            style={styles.menuBtn}
            onClick={() => setSidebarOpen((p) => !p)}
          >
            ☰
          </button>

          <div style={styles.topTitle}>
            {activeSession ? activeSession.title : "XTROM"}
          </div>

          <div style={styles.topStatus}>
            {loading ? "Thinking..." : "Online"}
          </div>
        </header>

        <div style={styles.chatArea} ref={chatRef}>
          {activeSession?.messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msgRow,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.userBubble : styles.aiBubble)
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.aiBubble, opacity: 0.7 }}>
                XTROM processing<span style={styles.dots}>...</span>
              </div>
            </div>
          )}
        </div>

        {imagePreview && (
          <div style={styles.previewBox}>
            <img src={imagePreview} style={styles.previewImg} />
            <button style={styles.removeImgBtn} onClick={removeImage}>
              ✖
            </button>
          </div>
        )}

        <div style={styles.inputBar}>
          <label style={styles.uploadBtn}>
            📎
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              style={{ display: "none" }}
            />
          </label>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste error log / kode / upload screenshot..."
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button style={styles.sendBtn} onClick={sendMessage}>
            ➤
          </button>
        </div>
      </section>

      <style>{`
        @keyframes pulseRed {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes flicker {
          0%,100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    height: "100vh",
    display: "flex",
    background:
      "radial-gradient(circle at top, rgba(255,0,0,0.22), rgba(10,0,0,1) 60%, rgba(0,0,0,1))",
    color: "white",
    overflow: "hidden",
    fontFamily: "system-ui, Arial"
  },

  sidebar: {
    background: "rgba(255,255,255,0.05)",
    borderRight: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(14px)",
    transition: "0.25s ease",
    overflow: "hidden"
  },

  brand: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "14px"
  },

  brandOrb: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(255,0,0,0.9), rgba(0,0,0,1))",
    boxShadow: "0 0 30px rgba(255,0,0,0.7)",
    animation: "pulseRed 2.8s infinite"
  },

  brandName: {
    fontSize: "18px",
    fontWeight: 900,
    letterSpacing: "1px"
  },

  brandTag: {
    fontSize: "12px",
    opacity: 0.7
  },

  newChatBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,0,0,0.20)",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    marginBottom: "14px"
  },

  chatList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    maxHeight: "62vh",
    paddingRight: "4px"
  },

  chatItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.25)",
    cursor: "pointer"
  },

  chatItemActive: {
    background: "rgba(255,0,0,0.18)",
    border: "1px solid rgba(255,0,0,0.35)"
  },

  chatTitle: {
    fontSize: "13px",
    fontWeight: 800,
    opacity: 0.9,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "190px"
  },

  deleteBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(0,0,0,0.35)",
    color: "white",
    cursor: "pointer"
  },

  clearBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    marginTop: "14px"
  },

  sidebarFooter: {
    marginTop: "12px",
    fontSize: "11px",
    opacity: 0.6,
    textAlign: "center"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh"
  },

  topBar: {
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)"
  },

  menuBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: 900
  },

  topTitle: {
    fontWeight: 900,
    fontSize: "14px",
    opacity: 0.9
  },

  topStatus: {
    fontSize: "12px",
    opacity: 0.7
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  msgRow: {
    display: "flex",
    width: "100%"
  },

  bubble: {
    padding: "12px 14px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: "1.5",
    maxWidth: "85%",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },

  userBubble: {
    background: "linear-gradient(135deg, rgba(255,0,0,0.95), rgba(255,80,80,0.85))",
    border: "1px solid rgba(255,120,120,0.35)",
    boxShadow: "0 0 20px rgba(255,0,0,0.25)"
  },

  aiBubble: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)"
  },

  dots: {
    animation: "flicker 1s infinite"
  },

  previewBox: {
    margin: "0 14px 10px 14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    overflow: "hidden",
    position: "relative"
  },

  previewImg: {
    width: "100%",
    maxHeight: "220px",
    objectFit: "cover",
    display: "block"
  },

  removeImgBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    background: "rgba(0,0,0,0.55)",
    color: "white",
    fontSize: "16px"
  },

  inputBar: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)"
  },

  uploadBtn: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "18px"
  },

  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    outline: "none",
    background: "rgba(0,0,0,0.55)",
    color: "white",
    fontSize: "14px"
  },

  sendBtn: {
    width: "60px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #ff0000, #ff4040, #ff7a7a)",
    color: "white",
    fontSize: "18px",
    fontWeight: 900,
    boxShadow: "0 0 24px rgba(255,0,0,0.35)"
  }
};