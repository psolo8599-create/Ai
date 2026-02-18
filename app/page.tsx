"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type ApiHistory = {
  role: "user" | "assistant";
  content: string;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Halo 👋 Aku Dardcor AI Ultra.\n\nAku bisa:\n• Debug error semua bahasa\n• Coding semua bahasa\n• Android (Sketchware/Studio)\n• Web (HTML/CSS/JS)\n• Analisis screenshot error/UI\n\nKirim error log atau screenshot sekarang."
    }
  ]);

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);

  const stars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      left: rand(0, 100),
      top: rand(0, 100),
      size: rand(1, 3.2),
      opacity: rand(0.08, 0.9),
      delay: rand(0, 4),
      duration: rand(2, 8)
    }));
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content: "Chat dibersihkan 😈 Sekarang kirim error log atau kode."
      }
    ]);
    setInput("");
    setImageBase64(null);
    setImagePreview(null);
  }

  function removeImage() {
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

  async function sendMessage() {
    if ((!input.trim() && !imageBase64) || loading) return;

    const userText = input.trim();

    const userMsgText = imageBase64
      ? `🖼️ [Gambar dikirim]\n${userText || "(tanpa teks)"}`
      : userText;

    const newMessages: Msg[] = [
      ...messages,
      { role: "user", content: userMsgText }
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history: ApiHistory[] = newMessages.slice(-10).map((m) => ({
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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "❌ Tidak ada respon dari AI."
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Error server. Pastikan OPENAI_API_KEY sudah benar."
        }
      ]);
    }

    setLoading(false);
    setImageBase64(null);
    setImagePreview(null);
  }

  return (
    <main style={styles.wrap}>
      {/* STAR FIELD */}
      <div style={styles.starLayer}>
        {stars.map((s) => (
          <span
            key={s.id}
            style={{
              ...styles.star,
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`
            }}
          />
        ))}
      </div>

      {/* NEBULA */}
      <div style={styles.nebulaA}></div>
      <div style={styles.nebulaB}></div>
      <div style={styles.nebulaC}></div>

      <section style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <div style={styles.orb}>
              <div style={styles.orbCore}></div>
              <div style={styles.orbGlow}></div>
              <div style={styles.ringA}></div>
              <div style={styles.ringB}></div>
              <div style={styles.ringC}></div>
              <div style={styles.scan}></div>
            </div>
          </div>

          <h1 style={styles.title}>Dardcor AI</h1>
          <p style={styles.subtitle}>
            Multifungsi • Coding • Debugging • Vision
          </p>
        </div>

        {/* CHAT */}
        <div style={styles.chat} ref={chatRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.userBubble : styles.aiBubble)
              }}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, ...styles.aiBubble, opacity: 0.7 }}>
              <span style={styles.dot}></span>
              <span style={styles.dot}></span>
              <span style={styles.dot}></span>
            </div>
          )}
        </div>

        {/* IMAGE PREVIEW */}
        {imagePreview && (
          <div style={styles.previewBox}>
            <img src={imagePreview} alt="Preview" style={styles.previewImg} />
            <button style={styles.removeImgBtn} onClick={removeImage}>
              ✖
            </button>
          </div>
        )}

        {/* INPUT */}
        <div style={styles.inputRow}>
          <label style={styles.uploadBtn}>
            📷
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
            placeholder="Tulis pertanyaan / paste error log / upload screenshot..."
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button style={styles.sendBtn} onClick={sendMessage}>
            ➤
          </button>
        </div>

        {/* BUTTONS */}
        <div style={styles.btnRow}>
          <button style={styles.smallBtn} onClick={clearChat}>
            Clear
          </button>
          <button
            style={styles.smallBtn}
            onClick={() =>
              alert("Tips: Paste error log, kode, atau upload screenshot.")
            }
          >
            Tips
          </button>
        </div>

        <footer style={styles.footer}>
          ⚡ Powered by Next.js • Vercel • OpenAI Vision
        </footer>
      </section>

      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }

        @keyframes orbPulse {
          0%,100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }

        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes spinReverse {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }

        @keyframes scanMove {
          0% { transform: translateY(-120px); opacity: 0; }
          35% { opacity: 0.6; }
          60% { opacity: 0.25; }
          100% { transform: translateY(120px); opacity: 0; }
        }

        @keyframes dots {
          0% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-5px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top, rgba(90,0,180,0.9), rgba(10,0,25,1) 65%, rgba(0,0,0,1))"
  },

  starLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    overflow: "hidden"
  },

  star: {
    position: "absolute",
    background: "white",
    borderRadius: "50%",
    animationName: "twinkle",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out"
  },

  nebulaA: {
    position: "absolute",
    width: "650px",
    height: "650px",
    background:
      "radial-gradient(circle, rgba(168,85,247,0.45), transparent 65%)",
    top: "-250px",
    left: "-250px",
    filter: "blur(65px)",
    zIndex: 0
  },

  nebulaB: {
    position: "absolute",
    width: "750px",
    height: "750px",
    background:
      "radial-gradient(circle, rgba(59,130,246,0.35), transparent 65%)",
    bottom: "-300px",
    right: "-320px",
    filter: "blur(75px)",
    zIndex: 0
  },

  nebulaC: {
    position: "absolute",
    width: "500px",
    height: "500px",
    background:
      "radial-gradient(circle, rgba(236,72,153,0.28), transparent 70%)",
    top: "35%",
    left: "-220px",
    filter: "blur(85px)",
    zIndex: 0
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "26px",
    padding: "20px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 0 80px rgba(168,85,247,0.25)",
    position: "relative",
    zIndex: 2
  },

  header: {
    textAlign: "center",
    marginBottom: "14px"
  },

  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px"
  },

  orb: {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), rgba(168,85,247,0.95), rgba(0,0,0,1))",
    boxShadow: "0 0 70px rgba(168,85,247,0.85)",
    animation: "orbPulse 3.4s ease-in-out infinite"
  },

  orbCore: {
    position: "absolute",
    inset: "0",
    background:
      "radial-gradient(circle at 70% 30%, rgba(59,130,246,0.20), transparent 55%)"
  },

  orbGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 40% 60%, rgba(236,72,153,0.15), transparent 60%)"
  },

  ringA: {
    position: "absolute",
    width: "210px",
    height: "210px",
    borderRadius: "50%",
    border: "2px solid rgba(168,85,247,0.35)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "spin 7s linear infinite"
  },

  ringB: {
    position: "absolute",
    width: "250px",
    height: "250px",
    borderRadius: "50%",
    border: "2px solid rgba(59,130,246,0.20)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "spinReverse 10s linear infinite"
  },

  ringC: {
    position: "absolute",
    width: "290px",
    height: "290px",
    borderRadius: "50%",
    border: "2px dashed rgba(236,72,153,0.14)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "spin 14s linear infinite"
  },

  scan: {
    position: "absolute",
    width: "100%",
    height: "55px",
    left: 0,
    top: 0,
    background:
      "linear-gradient(to bottom, transparent, rgba(255,255,255,0.22), transparent)",
    opacity: 0.35,
    animation: "scanMove 3.4s ease-in-out infinite"
  },

  title: {
    fontSize: "40px",
    fontWeight: 900,
    background: "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px"
  },

  subtitle: {
    fontSize: "13px",
    opacity: 0.8,
    marginTop: "4px"
  },

  chat: {
    height: "330px",
    overflowY: "auto",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  bubble: {
    padding: "12px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: "1.45",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxWidth: "85%"
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(168,85,247,0.95))",
    border: "1px solid rgba(99,102,241,0.55)",
    boxShadow: "0 0 22px rgba(59,130,246,0.25)"
  },

  aiBubble: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)"
  },

  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.8)",
    display: "inline-block",
    marginRight: "6px",
    animation: "dots 1s infinite"
  },

  previewBox: {
    marginTop: "12px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    overflow: "hidden",
    position: "relative"
  },

  previewImg: {
    width: "100%",
    display: "block",
    maxHeight: "220px",
    objectFit: "cover"
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

  inputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "14px"
  },

  uploadBtn: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "20px"
  },

  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    outline: "none",
    background: "rgba(0,0,0,0.45)",
    color: "white",
    fontSize: "14px"
  },

  sendBtn: {
    width: "58px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #ec4899, #2563eb, #a855f7)",
    color: "white",
    fontSize: "18px",
    fontWeight: 800,
    boxShadow: "0 0 26px rgba(236,72,153,0.35)"
  },

  btnRow: {
    display: "flex",
    gap: "10px",
    marginTop: "12px"
  },

  smallBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800
  },

  footer: {
    marginTop: "14px",
    textAlign: "center",
    fontSize: "12px",
    opacity: 0.6
  }
};