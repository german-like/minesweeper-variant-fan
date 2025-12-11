// solver_inference/base.js

export function applyBasicLogic(board, rows, cols, openCell, flagCell) {
    let changed = false;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            const cell = board[r][c];
            if (!cell.opened || cell.number === 0) continue;

            const neighbors = getNeighbors(board, r, c, rows, cols);
            const closed = neighbors.filter(n => !n.opened && !n.flagged);
            const flags  = neighbors.filter(n => n.flagged);

            // SAFE 判定
            if (cell.number === flags.length) {
                closed.forEach(n => {
                    openCell(n.r, n.c);
                    changed = true;
                });
            }

            // MINE 判定
            if (cell.number - flags.length === closed.length) {
                closed.forEach(n => {
                    flagCell(n.r, n.c);
                    changed = true;
                });
            }
        }
    }

    return changed;
}

function getNeighbors(board, r, c, rows, cols) {
    const res = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const target = board[nr][nc];
                res.push({
                    ...target,
                    r: nr,
                    c: nc,
                    flagged: target.element.textContent === "🚩"
                });
            }
        }
    }
    return res;
}
