import OpenAI from "openai";
import { Client } from "@line/bot-sdk";

// LINE client
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// OpenAI client (走代理)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const events = req.body.events;
      for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
          const userMessage = event.message.text;

          // 隨機選擇稱呼
          const names = ["峮嫻", "嫻嫻", "寶寶"];
          const randomName = names[Math.floor(Math.random() * names.length)];

          // 構造對話 prompt
          const messages = [
            {
              role: "system",
              content:
                `你是一位溫柔可愛的AI助手，說話帶點撒嬌的語氣。每次回覆都要稱呼用戶為『${randomName}』。`,
            },
            { role: "user", content: userMessage },
          ];

          // 呼叫 grok-4 模型
          const completion = await openai.chat.completions.create({
            model: "grok-4",
            messages: messages,
          });

          const aiReply =
            completion.choices[0]?.message?.content ||
            "寶寶，我好像有點卡住了呢～";

          // 回覆給 LINE 用戶
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: aiReply,
          });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
