const NUM_ROWS = 9;
const NUM_COLS = 9;
const NUM_MINES = 10;

const gameBoard = document.getElementById('gameBoard');
const statusElement = document.getElementById('status');
gameBoard.style.gridTemplateColumns = `repeat(${NUM_COLS}, 36px)`;

let board = [];
const numberColors = {1:'#00f',2:'#0a0',3:'#f00',4:'#00a',5:'#a00',6:'#0aa',7:'#000',8:'#555'};

// --- 盤面生成（初期化） ---
function initializeBoard(safeRow, safeCol) {
    let tempBoard = Array.from({ length: NUM_ROWS }, () =>
        Array.from({ length: NUM_COLS }, () => ({ isMine:false, count:0, revealed:false }))
    );

    let minesPlaced = 0;
    while (minesPlaced < NUM_MINES) {
        const r = Math.floor(Math.random()*NUM_ROWS);
        const c = Math.floor(Math.random()*NUM_COLS);
        const isSafeZone = (Math.abs(r-safeRow)<=1 && Math.abs(c-safeCol)<=1);
        if (!tempBoard[r][c].isMine && !isSafeZone) {
            tempBoard[r][c].isMine = true;
            minesPlaced++;
        }
    }

    for (let r=0;r<NUM_ROWS;r++) {
        for (let c=0;c<NUM_COLS;c++) {
            if (!tempBoard[r][c].isMine) {
                let count=0;
                for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
                    const nr=r+dr,nc=c+dc;
                    if (nr>=0 && nr<NUM_ROWS && nc>=0 && nc<NUM_COLS && tempBoard[nr][nc].isMine) count++;
                }
                tempBoard[r][c].count = count;
            }
        }
    }
    return tempBoard;
}

// --- プレイヤー操作 ---
function revealCell(row,col,isInitial=false) {
    if(!board[row]||!board[row][col]||board[row][col].revealed) return;
    board[row][col].revealed=true;
    if(board[row][col].isMine) { if(!isInitial){statusElement.textContent='ゲームオーバー！';revealAllMines();} return; }
    if(board[row][col].count===0) for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(dr!==0||dc!==0) revealCell(row+dr,col+dc);
}

function revealAllMines() {
    for(let r=0;r<NUM_ROWS;r++) for(let c=0;c<NUM_COLS;c++) if(board[r][c].isMine) board[r][c].revealed=true;
    renderBoard();
}

function handleCellClick(r,c) { if(board[r][c].revealed) return; revealCell(r,c); renderBoard(); checkWinCondition(); }

function checkWinCondition() {
    let revealedCount=0;
    for(let r=0;r<NUM_ROWS;r++) for(let c=0;c<NUM_COLS;c++) if(board[r][c].revealed) revealedCount++;
    if(revealedCount===NUM_ROWS*NUM_COLS-NUM_MINES){statusElement.textContent='クリア！おめでとう！';revealAllMines();}
}

// --- 描画 ---
function renderBoard() {
    gameBoard.innerHTML='';
    for(let r=0;r<NUM_ROWS;r++){
        for(let c=0;c<NUM_COLS;c++){
            const cellData=board[r][c];
            const cell=document.createElement('div');
            cell.className='cell';
            cell.dataset.row=r; cell.dataset.col=c;
            cell.onclick=()=>handleCellClick(r,c);

            if(cellData.revealed){
                cell.classList.add('revealed');
                if(cellData.isMine){cell.classList.add('mine');cell.textContent='💣';}
                else if(cellData.count>0){cell.textContent=cellData.count; cell.style.color=numberColors[cellData.count]||'#000';}
            }

            gameBoard.appendChild(cell);
        }
    }
}

// --- 論理的盤面生成 ---
function generateLogicalBoard() {
    const startRow=Math.floor(NUM_ROWS/2);
    const startCol=Math.floor(NUM_COLS/2);
    let attempts=0;
    statusElement.textContent='盤面を生成中です...';

    while(attempts<1000){
        let tempBoard=initializeBoard(startRow,startCol);
        if(isBoardSolvable(tempBoard,startRow,startCol)){
            board=tempBoard;
            revealCell(startRow,startCol,true);
            statusElement.textContent=`論理的に解ける盤面を ${attempts+1} 回目で生成しました。`;
            renderBoard(); return;
        }
        attempts++;
    }

    statusElement.textContent='【警告】完全ロジック盤面が見つかりませんでした。ランダム盤面を生成します。';
    board=initializeBoard(startRow,startCol);
    revealCell(startRow,startCol,true);
    renderBoard();
}

// --- 初回生成 ---
generateLogicalBoard();
