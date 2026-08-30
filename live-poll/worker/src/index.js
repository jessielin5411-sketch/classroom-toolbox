import { DurableObject } from "cloudflare:workers";

const MAX_ROOM_LENGTH = 32;
const MAX_PAYLOAD_BYTES = 500_000;
const DEFAULT_POLL = {
  question: "下週班級活動想選哪一個？",
  questionImage: "",
  options: [
    { id: "a", text: "戶外闖關日", image: "", votes: 0 },
    { id: "b", text: "教室桌遊派對", image: "", votes: 0 },
  ],
  round: 1,
};

function safeRoom(value) {
  return typeof value === "string" && /^[A-Za-z0-9-]{3,32}$/.test(value);
}

function validPoll(poll) {
  if (!poll || typeof poll.question !== "string" || !Array.isArray(poll.options)) return false;
  if (poll.question.length > 240 || poll.options.length < 2 || poll.options.length > 8) return false;
  if (JSON.stringify(poll).length > MAX_PAYLOAD_BYTES) return false;
  return poll.options.every((option) =>
    option && typeof option.id === "string" && typeof option.text === "string" &&
    option.id.length <= 64 && option.text.length <= 80 && typeof option.votes === "number"
  );
}

export class PollRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.poll = null;
  }

  async getPoll() {
    if (!this.poll) this.poll = (await this.ctx.storage.get("poll")) || structuredClone(DEFAULT_POLL);
    return this.poll;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify({ type: "state", poll: await this.getPoll() }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket, raw) {
    try {
      if (typeof raw !== "string" || raw.length > MAX_PAYLOAD_BYTES) throw new Error("訊息太大或格式不正確");
      const message = JSON.parse(raw);
      const poll = await this.getPoll();
      if (message.type === "replace" && validPoll(message.poll)) {
        this.poll = message.poll;
        await this.ctx.storage.put("poll", this.poll);
        this.broadcast({ type: "state", poll: this.poll });
        return;
      }
      if (message.type === "vote" && typeof message.optionId === "string") {
        const option = poll.options.find((item) => item.id === message.optionId);
        if (!option) throw new Error("找不到投票選項");
        option.votes += 1;
        await this.ctx.storage.put("poll", poll);
        this.broadcast({ type: "state", poll });
        return;
      }
      throw new Error("不支援的操作");
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: error.message || "同步失敗" }));
    }
  }

  webSocketClose(socket, code, reason) {
    socket.close(code, reason);
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(data); } catch { /* connection already closed */ }
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true, service: "classroom-live-poll" });
    const match = url.pathname.match(/^\/room\/([A-Za-z0-9-]+)$/);
    if (!match || !safeRoom(match[1])) return new Response("Not found", { status: 404 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }
    return env.POLL_ROOM.getByName(match[1].toUpperCase()).fetch(request);
  },
};
