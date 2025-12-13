// =============================================
// 設定
// =============================================
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const flagsLeftEl = document.getElementById("flagsLeft");
const newBtn = document.getElementById("newBtn");
const modeBtn = document.getElementById("modeBtn");
const ruleSelect = document.getElementById("ruleSelect");
const presetSelect = document.getElementById("preset");

let grid = [];
let rows = 0;
let cols = 0;
let mineCount = 0;
let flagsLeft = 0;
let gameOver = false;
let firstClick = false;

let shovelMode = true; // true: 掘る, false: 旗


// =============================================
// .brd ファイルの読み込み
// 0 = 未開封安全
// 1 = 未開封地雷
// - = 開封済み安全
// =============================================
async function loadBoards() {
    const response = await fetch("boards.brd");
    const text = await response.text();

    const boards = [];

    // メタ行 "[" の前で区切る
    const blocks = text.trim().split(/\n(?=\[)/);

    for (const block of blocks) {
        const lines = block.split(/\r?\n/).map(l => l.trim());
        if (lines.length < 2) continue;

        // メタ行
        const metaLine = lines[lines.length - 1];
        const metaMatch = metaLine.match(/\[(\d+)\/(\d+)\/([0-9A-Fa-f]{3})\/([A-Za-z])\]/);

        if (!metaMatch) {
            console.error("メタ行エラー:", metaLine);
            continue;
        }

        const size = parseInt(metaMatch[1]);
        const mines = parseInt(metaMatch[2]);
        const ruleChar = metaMatch[4];

        const boardLines = lines.slice(0, -1);
        if (boardLines.length !== size) {
            console.error("行数不一致");
            continue;
        }

        const grid = [];

        for (let r = 0; r < size; r++) {
            const row = boardLines[r];
            if (row.length !== size) {
                console.error("列数不一致");
                continue;
            }

            const rowArr = [];
            for (let c = 0; c < size; c++) {
                const ch = row[c];
                rowArr.push({
                    mine: ch === "1",
                    revealed: ch === "-",
                    flagged: false,
                    num: 0,
                    row: r,
                    col: c
                });
            }
            grid.push(rowArr);
        }

        boards.push({
            grid,
            meta: { size, mines, ruleChar }
        });
    }

    return boards;
}


// =============================================
// 新規ゲーム開始
// =============================================
async function startNew() {
    statusEl.textContent = "盤面読込中…";
    boardEl.innerHTML = "";

    const boards = await loadBoards();
    if (boards.length === 0) {
        statusEl.textContent = "盤面がありません";
        return;
    }

    const picked = boards[Math.floor(Math.random() * boards.length)];

    rows = picked.meta.size;
    cols = picked.meta.size;
    mineCount = picked.meta.mines;

    ruleSelect.value = picked.meta.ruleChar === "A" ? "amplify" : "normal";

    flagsLeft = mineCount;
    flagsLeftEl.textContent = flagsLeft;

    gameOver = false;
    firstClick = false;

    ruleSelect.disabled = false;
    presetSelect.disabled = false;

    // ★ ここ重要：もう再変換しない
    grid = picked.grid;

    computeAdjacencies();
    renderBoard();

    statusEl.textContent = "準備完了";
}


// =============================================
// 隣接地雷計算
// =============================================
function computeAdjacencies() {
    const amplify = ruleSelect.value === "amplify";

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            const cell = grid[r][c];
            if (cell.mine) {
                cell.num = -1;
                continue;
            }

            let count = 0;

            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;

                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

                    if (grid[nr][nc].mine) {
                        if (amplify) {
                            count += ((nr + nc) % 2 === 0) ? 2 : 1;
                        } else {
                            count += 1;
                        }
                    }
                }
            }
            cell.num = count;
        }
    }
}


// =============================================
// 描画
// =============================================
function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    boardEl.style.gridTemplateRows = `repeat(${rows}, 30px)`;
    boardEl.innerHTML = "";

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = grid[r][c];
            const div = document.createElement("div");
            div.className = "cell";

            if (ruleSelect.value === "amplify" && (r + c) % 2 === 0) {
                div.classList.add("dark");
            }

            if (cell.revealed) {
                div.classList.add("revealed");
                div.classList.remove("dark");

                if (cell.mine) {
                    div.textContent = "●";
                    div.classList.add("mine");
                } else if (cell.num > 0) {
                    div.textContent = cell.num;
                }
            } else if (cell.flagged) {
                div.textContent = "⚑";
                div.classList.add("flag");
            }

            div.addEventListener("click", () => {
                shovelMode ? onCellClick(r, c) : toggleFlag(r, c);
            });

            div.addEventListener("contextmenu", e => {
                e.preventDefault();
                toggleFlag(r, c);
            });

            boardEl.appendChild(div);
        }
    }
}


// =============================================
// セル操作
// =============================================
function onCellClick(r, c) {
    if (gameOver) return;

    if (!firstClick) {
        firstClick = true;
        ruleSelect.disabled = true;
        presetSelect.disabled = true;
    }

    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;

    if (cell.mine) {
        gameOver = true;
        revealAllMines();
        statusEl.textContent = "ゲームオーバー…";
        return;
    }

    if (cell.num === 0) openZeroArea(r, c);

    checkWin();
    renderBoard();
}


function openZeroArea(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

            const cell = grid[nr][nc];
            if (!cell.revealed && !cell.flagged) {
                cell.revealed = true;
                if (cell.num === 0) openZeroArea(nr, nc);
            }
        }
    }
}


// =============================================
// 旗
// =============================================
function toggleFlag(r, c) {
    if (gameOver) return;

    const cell = grid[r][c];
    if (cell.revealed) return;

    if (cell.flagged) {
        cell.flagged = false;
        flagsLeft++;
    } else {
        if (flagsLeft <= 0) return;
        cell.flagged = true;
        flagsLeft--;
    }

    flagsLeftEl.textContent = flagsLeft;
    renderBoard();
}


// =============================================
// 終了処理
// =============================================
function revealAllMines() {
    grid.flat().forEach(c => { if (c.mine) c.revealed = true; });
    ruleSelect.disabled = false;
    presetSelect.disabled = false;
    renderBoard();
}

function checkWin() {
    for (const row of grid)
        for (const cell of row)
            if (!cell.mine && !cell.revealed) return;

    gameOver = true;
    statusEl.textContent = "勝利！";
    ruleSelect.disabled = false;
    presetSelect.disabled = false;
}


// =============================================
// UI
// =============================================
modeBtn.addEventListener("click", () => {
    shovelMode = !shovelMode;
    modeBtn.textContent = shovelMode ? "シャベル" : "旗";
});

newBtn.addEventListener("click", startNew);

// 初期起動
startNew();
