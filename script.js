const boardElem = document.getElementById("board");
const preset = document.getElementById("preset");
const ruleSelect = document.getElementById("ruleSelect");
const newBtn = document.getElementById("newBtn");
const modeBtn = document.getElementById("modeBtn");
const flagsLeftElem = document.getElementById("flagsLeft");
const statusElem = document.getElementById("status");

let rows = 5;
let cols = 5;
let mines = 5;       // 後で自動設定
let board = [];
let firstClick = true;
let gameOver = false;
let mode = "dig";    // dig / flag
let mineCount = 0;
let flagsLeft = 0;
let rule = "normal";

newBtn.onclick = () => newGame();
modeBtn.onclick = switchMode;

preset.onchange = () => setPreset();
ruleSelect.onchange = () => {
  if (!gameOver && !firstClick) {
    ruleSelect.value = rule;
    return;
  }
  rule = ruleSelect.value;
};

function setPreset() {
  const val = preset.value.split("x");
  rows = Number(val[0]);
  cols = Number(val[1]);
}

function switchMode() {
  mode = mode === "dig" ? "flag" : "dig";
  modeBtn.textContent = mode === "dig" ? "シャベル" : "旗";
}

function newGame() {
  setPreset();
  rule = ruleSelect.value;

  // 地雷率 30〜50% のランダム
  const rate = 0.3 + Math.random() * 0.2;
  mineCount = Math.floor(rows * cols * rate);
  flagsLeft = mineCount;

  firstClick = true;
  gameOver = false;
  flagsLeftElem.textContent = flagsLeft;
  statusElem.textContent = "準備完了";

  createBoard();
}

function createBoard() {
  boardElem.innerHTML = "";
  boardElem.style.gridTemplateColumns = `repeat(${cols}, 32px)`;

  board = [];
  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      board[r][c] = {
        mine: false,
        open: false,
        flag: false,
        count: 0
      };
    }
  }

  // UI作成
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      // チェス盤の暗マス
      if ((r + c) % 2 === 1) {
        cell.classList.add("dark");
      }

      cell.dataset.r = r;
      cell.dataset.c = c;

      cell.oncontextmenu = (e) => e.preventDefault();
      cell.addEventListener("mousedown", (e) => {
        if (gameOver) return;
        if (e.button === 0) handleLeft(r, c);
        else handleRight(r, c);
      });

      boardElem.appendChild(cell);
    }
  }
}

// 初手セーフ地雷配置
function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (r === safeR && c === safeC) continue;
    if (board[r][c].mine) continue;

    board[r][c].mine = true;
    placed++;
  }

  countNumbers();
}

function countNumbers() {
  const dy = [-1,-1,-1,0,0,1,1,1];
  const dx = [-1,0,1,-1,1,-1,0,1];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let cnt = 0;

      for (let i = 0; i < 8; i++) {
        const nr = r + dy[i];
        const nc = c + dx[i];
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

        if (board[nr][nc].mine) {
          // 増幅ルール：暗マスは 2カウント
          if (rule === "amplify" && ((nr + nc) % 2 === 1)) cnt += 2;
          else cnt += 1;
        }
      }
      board[r][c].count = cnt;
    }
  }
}

function handleLeft(r, c) {
  if (gameOver) return;

  if (firstClick) {
    placeMines(r, c);
    firstClick = false;
  }

  const cell = board[r][c];
  if (cell.open || cell.flag) return;

  if (cell.mine) {
    revealAll();
    statusElem.textContent = "ゲームオーバー";
    gameOver = true;
    return;
  }

  openCell(r, c);
}

function handleRight(r, c) {
  if (gameOver) return;
  const cell = board[r][c];
  if (cell.open) return;

  cell.flag = !cell.flag;
  flagsLeft += cell.flag ? -1 : 1;
  flagsLeftElem.textContent = flagsLeft;

  updateCell(r, c);
}

function openCell(r, c) {
  const cell = board[r][c];
  if (cell.open || cell.flag) return;

  cell.open = true;
  updateCell(r, c);

  if (cell.count === 0) {
    const dy = [-1,-1,-1,0,0,1,1,1];
    const dx = [-1,0,1,-1,1,-1,0,1];
    for (let i = 0; i < 8; i++) {
      const nr = r + dy[i];
      const nc = c + dx[i];
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      openCell(nr, nc);
    }
  }
}

function updateCell(r, c) {
  const idx = r * cols + c;
  const elem = boardElem.children[idx];
  const cell = board[r][c];

  elem.className = "cell";
  if ((r + c) % 2 === 1) elem.classList.add("dark");

  if (cell.open) {
    elem.classList.add("open");
    if (cell.count > 0) elem.textContent = cell.count;
  } else if (cell.flag) {
    elem.classList.add("flag");
    elem.textContent = "⚑";
  } else {
    elem.textContent = "";
  }
}

function revealAll() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const elem = boardElem.children[idx];
      const cell = board[r][c];

      if (cell.mine) {
        elem.classList.add("mine");
        elem.textContent = "×";
      }
    }
  }
}

newGame();
