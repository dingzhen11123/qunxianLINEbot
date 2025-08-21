import { OpenAI } from "openai";
import { Client } from "@line/bot-sdk";

// 初始化 LINE 客户端
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// 初始化 OpenAI 客户端（走代理）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://www.dmxapi.cn/v1/",
});

// Vercel 的入口
export default async function handler(req, res) {
  if (req.method === "POST") {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;

        try {
          // 调用第三方 API (模型 grok-4)
          const response = await openai.chat.completions.create({
            model: "grok-4",  // 指定模型
            messages: [{ role: "user", content: userMessage }],
          });

          const replyText =
            response.choices[0]?.message?.content || "（出错了，稍后再试吧）";

          // 回复给 LINE 用户
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: replyText,
          });
        } catch (error) {
          console.error("OpenAI API 出错:", error);
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "抱歉，AI 出了一点问题 😢",
          });
        }
      }
    }

    res.status(200).send("OK");
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
