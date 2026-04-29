/**
 * Envía un mensaje a Telegram. No lanza si falta config o si la API falla:
 * los errores se loguean pero el caller puede seguir.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Telegram sendMessage falló:", res.status, body);
    }
  } catch (err) {
    console.error("Telegram sendMessage error:", err);
  }
}
