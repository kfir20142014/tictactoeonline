const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static("../public"));

const USERS_FILE = "./users.json";
let users = JSON.parse(fs.readFileSync(USERS_FILE));

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* הרשמה */
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || users[username]) {
    return res.send({ ok: false });
  }
  users[username] = { password, score: 0 };
  saveUsers();
  res.send({ ok: true });
});

/* התחברות */
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.send({ ok: false });
  }
  res.send({ ok: true, score: users[username].score });
});

/* WebSocket */
let rooms = {};

wss.on("connection", ws => {
  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "join") {
      ws.room = data.room;
      ws.user = data.user;
      rooms[ws.room] ??= [];
      rooms[ws.room].push(ws);
    }

    if (data.type === "move" || data.type === "chat") {
      rooms[ws.room].forEach(c => c.send(JSON.stringify(data)));
    }

    if (data.type === "saveScore") {
      if (users[data.user]) {
        users[data.user].score = data.score;
        saveUsers();
      }
    }
  });

  ws.on("close", () => {
    if (!ws.room) return;
    rooms[ws.room] = rooms[ws.room].filter(c => c !== ws);
  });
});

server.listen(3000, () => {
  console.log("http://localhost:3000");
});
