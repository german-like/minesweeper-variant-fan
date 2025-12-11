// index.ts

import { runBaseInference, BaseInferenceResult } from "./base.ts";
import { runSetInference, InferenceResult as SetResult } from "./set.ts";
import { runUnderstoodInference, UnderstoodResult } from "./understood.ts";

/**
 * 盤面情報を取り出すためのインターフェース。
 * あなたのゲーム側の関数を渡す前提。
 */
export interface SolverContext {
    collectClueGroups: () => any;              // set.ts 用
    collectBaseNeighbors: () => any;           // base.ts 用
    collectPatterns?: () => any;               // understood.ts 用（任意）
    applySafe: (r: number, c: number) => void; // 開ける処理
    applyMine: (r: number, c: number) => void; // 旗を立てる OR 地雷確定扱い
}

/**
 * solveStep()
 * 1STEP ぶんだけ推論し、実際に盤面へ適用する。
 */
export function solveStep(ctx: SolverContext): boolean {
    let progressed = false;

    // 1. Base inference（最速・確実）
    const base = runBaseInference(ctx.collectBaseNeighbors);
    progressed = applyResult(base, ctx) || progressed;

    // 2. Set inference（集合推論）
    const set = runSetInference(ctx.collectClueGroups);
    progressed = applyResult(set, ctx) || progressed;

    // 3. Pattern inference（人間がよく知るパターン）
    if (ctx.collectPatterns) {
        const ud = runUnderstoodInference(ctx.collectPatterns);
        progressed = applyResult(ud, ctx) || progressed;
    }

    return progressed;
}

/** 推論結果を盤面に適用する共通関数 */
function applyResult(
    result: { safe?: Set<string>; mine?: Set<string> },
    ctx: SolverContext
): boolean {
    let updated = false;

    if (result.safe) {
        for (const k of result.safe) {
            const [r, c] = k.split(",").map(Number);
            ctx.applySafe(r, c);
            updated = true;
        }
    }
    if (result.mine) {
        for (const k of result.mine) {
            const [r, c] = k.split(",").map(Number);
            ctx.applyMine(r, c);
            updated = true;
        }
    }
    return updated;
}
