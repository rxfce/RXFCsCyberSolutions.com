// server.js
import express from "express"; import fetch from "node-fetch";
const app = express(); app.use(express.json());
app.post("/contact", async (req, res) => {
  const { name, message } = req.body || {};
  const resp = await fetch("YOUR_WEBHOOK_URL", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `From ${name}: ${message}` })
  });
  res.status(resp.ok ? 200 : 500).end();
});
app.listen(3000, () => console.log("Ready on :3000"));
