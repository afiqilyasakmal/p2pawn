"use client";

import { Chess } from "chess.js";

interface MoveHistoryProps {
  chess: Chess;
}

export function MoveHistory({ chess }: MoveHistoryProps) {
  const history = chess.history({ verbose: true });

  if (history.length === 0) {
    return null;
  }

  // Group moves into pairs
  const movePairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i].san,
      black: history[i + 1]?.san,
    });
  }

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Moves
          </h3>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          <table className="w-full text-sm">
            <tbody>
              {movePairs.map((pair) => (
                <tr
                  key={pair.num}
                  className="even:bg-stone-50 rounded"
                >
                  <td className="px-2 py-1 text-stone-400 text-xs w-8 text-right font-mono">
                    {pair.num}.
                  </td>
                  <td className="px-2 py-1 font-mono text-stone-800 font-medium">
                    {pair.white}
                  </td>
                  <td className="px-2 py-1 font-mono text-stone-800">
                    {pair.black || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
