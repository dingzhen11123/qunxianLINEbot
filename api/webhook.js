import { Client } from "@line/bot-sdk";

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

export const config = {
  api: {
    bodyParser: false, // LINE Webhook 必须禁用内置 bodyParser
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(buffers).toString());

      const events = body.events || [];
      for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "✅ 收到你的消息啦！",
          });
        }
      }

      res.status(200).send("OK");
    } catch (err) {
      console.error("Webhook Error:", err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
