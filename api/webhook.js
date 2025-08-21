import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;

        // 调用 OpenAI
        const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-5-mini",   // 你也可以换成 gpt-4o-mini 之类的
            messages: [{ role: "user", content: userMessage }]
          })
        });
        const gptData = await gptRes.json();
        const replyText = gptData.choices[0].message.content;

        // 回复 LINE
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: replyText }]
          })
        });
      }
    }
    res.status(200).json({ ok: true });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
