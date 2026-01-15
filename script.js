let socket, board, current = "X", active, mode, user, score = 0;

const cells = document.querySelectorAll(".cell");
const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function register() {
  fetch("/register", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ username:user.value, password:pass.value })
  }).then(r=>r.json()).then(d=>alert(d.ok?"נרשמת":"שגיאה"));
}

function login() {
  fetch("/login", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ username:user.value, password:pass.value })
  }).then(r=>r.json()).then(d=>{
    if (!d.ok) return alert("שגיאה");
    score = d.score;
    document.getElementById("auth").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidden");
    user = user.value;
  });
}

function start() {
  mode = document.getElementById("mode").value;
  socket = new WebSocket("ws://localhost:3000");
  socket.onopen = () => {
    socket.send(JSON.stringify({ type:"join", room:room.value, user }));
  };
  socket.onmessage = e => handle(JSON.parse(e.data));

  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  reset();
}

function reset() {
  board = ["","","","","","","","",""];
  active = true;
  current = "X";
  cells.forEach(c=>c.textContent="");
}

cells.forEach(c=>{
  c.onclick=()=>{
    if (!active || board[c.dataset.i]) return;
    move(c.dataset.i);
  };
});

function move(i) {
  board[i]=current;
  cells[i].textContent=current;
  socket.send(JSON.stringify({type:"move", i, player:current}));
  check();
}

function handle(d) {
  if (d.type==="move") {
    board[d.i]=d.player;
    cells[d.i].textContent=d.player;
    check();
  }
  if (d.type==="chat") {
    chat.innerHTML+=`<div>${d.msg}</div>`;
  }
}

function check() {
  if (wins.some(w=>w.every(i=>board[i]===current))) {
    active=false;
    if (current==="X") score++;
    socket.send(JSON.stringify({type:"saveScore", user, score}));
    document.getElementById("score").textContent="ניקוד: "+score;
    return;
  }
  current=current==="X"?"O":"X";
  if (mode==="bot" && current==="O") bot();
}

function bot() {
  for (let w of wins) {
    let m=w.map(i=>board[i]);
    if (m.filter(x=>x==="O").length===2 && m.includes("")) {
      return move(w[m.indexOf("")]);
    }
  }
  for (let w of wins) {
    let m=w.map(i=>board[i]);
    if (m.filter(x=>x==="X").length===2 && m.includes("")) {
      return move(w[m.indexOf("")]);
    }
  }
  if (board[4]==="") return move(4);
  [0,2,6,8].some(i=>board[i]===""&&(move(i),true));
}

function sendChat() {
  socket.send(JSON.stringify({type:"chat", msg:chatInput.value}));
  chatInput.value="";
}
