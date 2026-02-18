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
        "Halo 👋 Aku Dardcor AI Ultra.\n\nAku bisa:\n- Debug error semua bahasa\n- Buat kode HTML/CSS/JS\n- Bantu Android (Sketchware/Studio)\n- Analisis screenshot error/UI\n\nKirim error log atau screenshot sekarang."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);

  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: rand(0, 100),
      top: rand(0, 100),
      size: rand(1, 2.6),
      opacity: rand(0.15, 1),
      delay: rand(0, 5),
      duration: rand(2, 7)
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
        content: "Chat dibersihkan. Silakan tanya lagi 😈"
      }
    ]);
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

    const newMessages = [...messages, { role: "user", content: userMsgText }];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // history untuk backend
    const history: ApiHistory[] = newMessages
      .filter((m) => m.role !== "system")
      .slice(-10)
      .map((m) => ({
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
        { role: "assistant", content: data.reply || "❌ Tidak ada respon." }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Error koneksi server. Cek API key di Vercel."
        }
      ]);
    }

    setLoading(false);

    // hapus gambar setelah dikirim
    setImageBase64(null);
    setImagePreview(null);
  }

  return (
    <main style={styles.wrap}>
      {/* Stars */}
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

      {/* Glow */}
      <div style={styles.glowA}></div>
      <div style={styles.glowB}></div>
      <div style={styles.glowC}></div>

      <section style={styles.card}>
        <div style={styles.topArea}>
          <div style={styles.orbWrap}>
            <div style={styles.orb}>
              <div style={styles.orbInner}></div>
              <div style={styles.ring1}></div>
              <div style={styles.ring2}></div>
              <div style={styles.ring3}></div>
              <div style={styles.scanLine}></div>
            </div>
          </div>

          <h1 style={styles.title}>Dardcor AI</h1>
          <p style={styles.subtitle}>
            Multifungsi • Coding • Debugging • Vision
          </p>
        </div>

        <div style={styles.chat} ref={chatRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.user : styles.ai)
              }}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, ...styles.ai, opacity: 0.7 }}>
              ⏳ AI sedang menganalisis...
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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button style={styles.sendBtn} onClick={sendMessage}>
            ➤
          </button>
        </div>

        <div style={styles.btnRow}>
          <button style={styles.smallBtn} onClick={clearChat}>
            Clear
          </button>

          <button
            style={styles.smallBtn}
            onClick={() => alert("Kirim screenshot error biar AI debug otomatis.")}
          >
            Tips
          </button>

          <button
            style={styles.smallBtn}
            onClick={() =>
              alert(
                "Deploy cepat: GitHub → Vercel → Environment Variables OPENAI_API_KEY → Redeploy."
              )
            }
          >
            Deploy
          </button>
        </div>

        <footer style={styles.footer}>
          ⚡ Next.js + Vercel Serverless + Vision AI
        </footer>
      </section>

      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.9); }
        }

        @keyframes orbPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.07); filter: brightness(1.15); }
        }

        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes spinReverse {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }

        @keyframes scan {
          0% { transform: translateY(-120px); opacity: 0; }
          30% { opacity: 0.5; }
          60% { opacity: 0.25; }
          100% { transform: translateY(120px); opacity: 0; }
        }
      `}</style>
    </main>
  );
}

const styles: any = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "22px",
    position: "relative",
    overflow: "hidden"
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
    animationName: "starTwinkle",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out"
  },

  glowA: {
    position: "absolute",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(168,85,247,0.30), transparent)",
    top: "-220px",
    left: "-220px",
    filter: "blur(55px)",
    zIndex: 0
  },

  glowB: {
    position: "absolute",
    width: "650px",
    height: "650px",
    background: "radial-gradient(circle, rgba(59,130,246,0.25), transparent)",
    bottom: "-250px",
    right: "-240px",
    filter: "blur(65px)",
    zIndex: 0
  },

  glowC: {
    position: "absolute",
    width: "450px",
    height: "450px",
    background: "radial-gradient(circle, rgba(236,72,153,0.18), transparent)",
    top: "40%",
    left: "-160px",
    filter: "blur(70px)",
    zIndex: 0
  },

  card: {
    width: "100%",
    maxWidth: "600px",
    borderRadius: "28px",
    padding: "24px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 0 70px rgba(168,85,247,0.20)",
    position: "relative",
    zIndex: 2
  },

  topArea: {
    textAlign: "center",
    marginBottom: "14px"
  },

  orbWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px"
  },

  orb: {
    width: "165px",
    height: "165px",
    borderRadius: "50%",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(168,85,247,0.95), rgba(10,0,18,1))",
    boxShadow: "0 0 70px rgba(168,85,247,0.85)",
    animation: "orbPulse 3.2s ease-in-out infinite"
  },

  orbInner: {
    position: "absolute",
    inset: "0",
    background:
      "radial-gradient(circle at 70% 30%, rgba(59,130,246,0.22), transparent 55%)",
    opacity: 0.8
  },

  ring1: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    border: "2px solid rgba(168,85,247,0.30)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "spin 7s linear infinite"
  },

  ring2: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    border: "2px solid rgba(59,130,246,0.18)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "spinReverse 11s linear infinite"
  },

  ring3: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    border: "2px dashed rgba(236,72,153,0.12)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "spin 16s linear infinite"
  },

  scanLine: {
    position: "absolute",
    width: "100%",
    height: "55px",
    left: 0,
    top: 0,
    background:
      "linear-gradient(to bottom, transparent, rgba(255,255,255,0.20), transparent)",
    opacity: 0.3,
    animation: "scan 3.5s ease-in-out infinite"
  },

  title: {
    fontSize: "38px",
    fontWeight: 900,
    background: "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px"
  },

  subtitle: {
    marginTop: "4px",
    fontSize: "13px",
    opacity: 0.75
  },

  chat: {
    height: "320px",
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
    maxWidth: "86%"
  },

  user: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #2563eb, #a855f7)",
    border: "1px solid rgba(99,102,241,0.55)"
  },

  ai: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)"
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
    marginTop: "16px"
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
    width: "56px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #ec4899, #2563eb, #a855f7)",
    color: "white",
    fontSize: "18px",
    fontWeight: 800,
    boxShadow: "0 0 24px rgba(236,72,153,0.35)"
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
    fontWeight: 700
  },

  footer: {
    marginTop: "18px",
    textAlign: "center",
    fontSize: "12px",
    opacity: 0.55
  }
};