import { Configuration, OpenAIApi } from "openai";
import { Client } from "@line/bot-sdk";

// LINE client
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// OpenAI client (通过 DMX API 中转)
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    basePath: process.env.OPENAI_BASE_URL, // 这里就是 https://www.dmxapi.cn/v1/
  })
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const events = req.body.events;

      for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
          const userMessage = event.message.text;

          // 构造对话 prompt
          const messages = [
            {
              role: "system",
              content:
                "你是一位温柔的AI助手。无论用户说什么，你都要用可爱的语气回复，并且称呼用户为『峮嫻』『嫻嫻』或者『寶寶』。回答要简短温柔，带点撒娇。",
            },
            { role: "user", content: userMessage },
          ];

          // 调用 grok-4
          const completion = await openai.createChatCompletion({
            model: "grok-4",
            messages,
          });

          const aiReply =
            completion.data.choices[0].message?.content ||
            "寶寶，我有點卡住了呢～";

          // 回复 LINE
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: aiReply,
          });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).send("Error");
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
