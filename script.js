const boardEl = document.getElementById('board');
const newBtn = document.getElementById('newBtn');
const modeBtn = document.getElementById('modeBtn');
const statusEl = document.getElementById('status');
const flagsLeftEl = document.getElementById('flagsLeft');
const ruleSelect = document.getElementById('ruleSelect');
const presetSelect = document.getElementById('preset');

let rows = 5;
let cols = 5;
let mineCount = 5;
let grid;
let gameOver = false;
let firstClick = false;
let flagMode = false;
let flagsLeft = 0;

modeBtn.onclick = () => {
  flagMode = !flagMode;
  modeBtn.textContent = flagMode ? '旗' : 'シャベル';
};

function createGrid(){
  grid = Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>({mine:false,num:0,revealed:false,flagged:false,row:r,col:c})));
}

function placeMines(){
  let placed = 0;
  while(placed < mineCount){
    const r = Math.floor(Math.random()*rows);
    const c = Math.floor(Math.random()*cols);
    if(!grid[r][c].mine){ grid[r][c].mine = true; placed++; }
  }
}

function computeAdjacencies(){
  const amplify = ruleSelect.value === 'amplify';
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      let count = 0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        if(dr===0 && dc===0) continue;
        const nr=r+dr, nc=c+dc;
        if(nr>=0 && nr<rows && nc>=0 && nc<cols){
          if(grid[nr][nc].mine){
            if(amplify && (nr+nc)%2===0) count+=2; else count++;
          }
        }
      }
      grid[r][c].num = count;
    }
  }
}

function renderBoard(){
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 36px)`;
  flagsLeftEl.textContent = flagsLeft;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell = grid[r][c];
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.r = r;
      div.dataset.c = c;

      // チェス盤濃淡
      if(ruleSelect.value === 'amplify' && (r+c)%2===0){
        div.classList.add('dark');
      }

      if(cell.revealed){
        div.classList.add('revealed');
        if(cell.mine){ div.classList.add('mine'); div.textContent='●'; }
        else if(cell.num>0) div.textContent = cell.num;
      } else if(cell.flagged){
        div.classList.add('flag');
        div.textContent='⚑';
      }

      div.onclick = () => onCellClick(r,c);
      div.oncontextmenu = (e)=>{
        e.preventDefault();
        if(!cell.revealed){
          cell.flagged = !cell.flagged;
          flagsLeft += cell.flagged ? -1 : 1;
          renderBoard();
        }
      };

      boardEl.appendChild(div);
    }
  }
}

function revealCell(r,c){
  const cell = grid[r][c];
  if(cell.revealed || cell.flagged) return;
  cell.revealed = true;
  if(cell.mine){ gameOver=true; statusEl.textContent='ゲームオーバー'; revealAllMines(); return; }
  if(cell.num===0){
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      if(dr===0 && dc===0) continue;
      const nr=r+dr,nc=c+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols) revealCell(nr,nc);
    }
  }
}

function revealAllMines(){
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(grid[r][c].mine) grid[r][c].revealed=true;
}

function checkWin(){
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const cell = grid[r][c];
    if(!cell.mine && !cell.revealed) return false;
  }
  return true;
}

function onCellClick(r,c){
  if(gameOver) return;

  const cell = grid[r][c];
  if(flagMode){
    if(!cell.revealed){
      cell.flagged = !cell.flagged;
      flagsLeft += cell.flagged ? -1 : 1;
      renderBoard();
    }
    return;
  }

  if(!firstClick){
    firstClick=true;
    if(cell.mine){
      do { createGrid(); placeMines(); computeAdjacencies(); } while(grid[r][c].mine);
    }
  }

  revealCell(r,c);
  if(!gameOver && checkWin()){ gameOver=true; statusEl.textContent='パーフェクト！'; revealAllMines(); }
  renderBoard();
}

function startNew(){
  const preset = presetSelect.value.split('x');
  rows = parseInt(preset[0]); cols = parseInt(preset[1]);
  mineCount = Math.floor(rows*cols*0.2);
  flagsLeft = mineCount;
  gameOver=false; firstClick=false; statusEl.textContent='準備完了';

  createGrid(); placeMines(); computeAdjacencies(); renderBoard();
}

newBtn.onclick = startNew;
startNew();
