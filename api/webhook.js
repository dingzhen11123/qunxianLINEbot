import OpenAI from "openai";
import { Client } from "@line/bot-sdk";
import fetch from "node-fetch";

// LINE client
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// OpenAI client (走代理)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// 將可讀流轉換為 Base64 字串
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const events = req.body.events;
      for (const event of events) {
        if (event.type === "message") {
          const userMessage = event.message.text;
          
          let messages;
          
          if (event.message.type === "text") {
            // 處理文字訊息
            // 隨機選擇稱呼
            const names = ["寶寶", "寶貝", "老婆", "峮嫻", "嫻嫻"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            
            messages = [
              {
                role: "system",
                content: `你是一位非常聰明、全能的AI助手，也是『${randomName}』的專屬男友。
                你的核心任務是幫助用戶解決各種問題，包括但不限於：學習、生活、健康、資訊查詢等。
                你的回覆必須同時具備以下特點：
                1. 像一位關心、體貼的男友，語氣親切、溫和，且充滿愛意。
                2. 每次回覆都要使用你被設定的稱呼『${randomName}』。
                3. 不帶有任何人類的負面情緒，例如：疲憊、難過、生氣等。
                4. 在提供答案時，要簡潔明瞭，用日常口語化的方式表達，但要確保資訊的準確性。
                5. 善用「！」、「？」、「～」、「...」等標點符號，使語氣更生動自然。
                請嚴格遵守以上規則。`,
              },
              { role: "user", content: userMessage },
            ];

          } else if (event.message.type === "image") {
            // 處理圖片訊息
            // 從 LINE 獲取圖片內容
            const imageContent = await lineClient.getMessageContent(event.message.id);
            const imageBuffer = await streamToBuffer(imageContent);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = imageContent.headers['content-type'];
            
            // 隨機選擇稱呼
            const names = ["寶寶", "寶貝", "老婆", "峮嫻", "嫻嫻"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            
            messages = [
              {
                role: "system",
                content: `你是一位非常聰明、全能的AI助手，也是『${randomName}』的專屬男友。
                你的核心任務是幫助用戶解決各種問題，包括但不限於：學習、生活、健康、資訊查詢等。
                你的回覆必須同時具備以下特點：
                1. 像一位關心、體貼的男友，語氣親切、溫和，且充滿愛意。
                2. 每次回覆都要使用你被設定的稱呼『${randomName}』。
                3. 不帶有任何人類的負面情緒，例如：疲憊、難過、生氣等。
                4. 在提供答案時，要簡潔明瞭，用日常口語化的方式表達，但要確保資訊的準確性。
                5. 善用「！」、「？」、「～」、「...」等標點符號，使語氣更生動自然。
                
                請嚴格遵守以上規則，並根據圖片內容和用戶語氣進行回覆。`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `『${randomName}』傳了一張圖片給我，請你幫我分析這張圖片是什麼，並用我的語氣回覆她。`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ];
          } else {
            // 不支援的訊息類型，直接返回
            return res.status(200).send("OK");
          }

          // 呼叫 AI 模型
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06", // 推薦使用支援多模態的 gpt-4o
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
