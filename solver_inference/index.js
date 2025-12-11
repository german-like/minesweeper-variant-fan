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

// solver_inference/set.js

export function applySetLogic(board, rows, cols, openCell, flagCell) {
    const constraints = [];

    // 1. 制約生成
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = board[r][c];
            if (!cell.opened || cell.number === 0) continue;

            const info = getInfo(board, r, c, rows, cols);
            constraints.push({
                pos: { r, c },
                closed: info.closed.map(x => ({ r: x.r, c: x.c })),
                flags: info.flags.length,
                mines: cell.number - info.flags.length
            });
        }
    }

    let changed = false;

    // 2. ペア比較
    for (let i = 0; i < constraints.length; i++) {
        for (let j = i + 1; j < constraints.length; j++) {

            const A = constraints[i];
            const B = constraints[j];

            // 完全包含 A ⊂ B
            changed |= applySubset(A, B, openCell, flagCell);
            changed |= applySubset(B, A, openCell, flagCell);

            // 部分包含解析
            changed |= applyPartial(A, B, openCell, flagCell);
            changed |= applyPartial(B, A, openCell, flagCell);
        }
    }

    return changed;
}


//━━━━━━━━━━━━━━━━━━━━
//  完全包含 A ⊂ B
//━━━━━━━━━━━━━━━━━━━━
function applySubset(A, B, openCell, flagCell) {
    if (!isSubset(A.closed, B.closed)) return false;

    const diffCount = B.mines - A.mines;
    const extra = B.closed.filter(x => !inList(x, A.closed));

    if (diffCount === extra.length && diffCount > 0) {
        extra.forEach(x => flagCell(x.r, x.c));
        return true;
    }
    if (diffCount === 0 && extra.length > 0) {
        extra.forEach(x => openCell(x.r, x.c));
        return true;
    }
    return false;
}


//━━━━━━━━━━━━━━━━━━━━
//  部分的重なり A∩B
//━━━━━━━━━━━━━━━━━━━━
function applyPartial(A, B, openCell, flagCell) {
    const X  = A.closed.filter(x => inList(x, B.closed));
    if (X.length === 0) return false;

    const A_only = A.closed.filter(x => !inList(x, X));
    const B_only = B.closed.filter(x => !inList(x, X));

    // 地雷差とピース差の関係
    const diff = A.mines - B.mines;

    let changed = false;

    if (diff === A_only.length - B_only.length) {
        if (A_only.length > 0 && diff === A_only.length) {
            A_only.forEach(x => flagCell(x.r, x.c));
            changed = true;
        }
        if (B_only.length > 0 && diff === -B_only.length) {
            B_only.forEach(x => flagCell(x.r, x.c));
            changed = true;
        }
    }

    // 地雷が0確定
    if (A.mines <= X.length - A_only.length) {
        B_only.forEach(x => openCell(x.r, x.c));
        changed = true;
    }

    return changed;
}


//━━━━━━━━━━━━━━━━━━━━
//  ユーティリティ
//━━━━━━━━━━━━━━━━━━━━
function isSubset(A, B) {
    return A.every(a => inList(a, B));
}

function inList(x, list) {
    return list.some(y => x.r === y.r && x.c === y.c);
}

function getInfo(board, r, c, rows, cols) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const t = board[nr][nc];
                neighbors.push({
                    ...t,
                    r: nr,
                    c: nc,
                    flagged: t.element.textContent === "🚩"
                });
            }
        }
    }
    return {
        closed: neighbors.filter(n => !n.opened && !n.flagged),
        flags: neighbors.filter(n => n.flagged)
    };
                              }
