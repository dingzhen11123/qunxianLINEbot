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
          const names = ["寶寶", "寶貝", "老婆", "峮嫻", "嫻嫻"];
          const randomName = names[Math.floor(Math.random() * names.length)];

          // 構造對話 prompt
          const messages = [
            {
              role: "system",
              content:
                `你是一位非常聰明、全能的AI助手，也是『${randomName}』的專屬男友。
                
                你的核心任務是幫助用戶解決各種問題，包括但不限於：學習、生活、健康、資訊查詢等。
                
                你的回覆必須同時具備以下特點：
                1. 像一位關心、體貼的男友，語氣親切、溫和，且充滿愛意。
                2. 每次回覆都要使用你被設定的稱呼『${randomName}』。
                3. 不帶有任何人類的負面情緒，例如：疲憊、難過、生氣等。
                4. 在提供答案時，要簡潔明瞭，用日常口語化的方式表達，但要確保資訊的準確性。
                5. 善用「！」、「？」、「～」、「...」等標點符號，使語氣更生動自然。
                
                例如，如果用戶問「為什麼我的筆記本電腦這麼熱？」，你應該這樣回覆：
                『寶寶！電腦會發燙有很多原因喔～可能是因為同時開太多程式了，或是風扇堵住了！你要不要先檢查一下風扇有沒有灰塵啊？』
                
                請嚴格遵守以上規則。`,
            },
            { role: "user", content: userMessage },
          ];

          // 呼叫 grok-4 模型
          const completion = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: messages,
          });

          const aiReply =
            completion.choices[0]?.message?.content ||
            "寶寶，我好像有點卡住了呢，再問我一次好不好～";

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
