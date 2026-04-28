"use client";

import { useState } from "react";

interface LobbyProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  error: string | null;
}

export function Lobby({ onCreateGame, onJoinGame, error }: LobbyProps) {
  const [gameIdInput, setGameIdInput] = useState("");
  const [mode, setMode] = useState<"menu" | "join">("menu");

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameIdInput.trim()) {
      onJoinGame(gameIdInput.trim().toUpperCase());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      {/* Logo / Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-light tracking-tight text-stone-800 mb-2">
          P2Pawn
        </h1>
        <p className="text-stone-500 text-sm font-mono">
          No server and no account needed. Create your own game and share it with your friends.
        </p>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
        {mode === "menu" && (
          <>
            <button
              onClick={() => {
                setMode("menu");
                onCreateGame();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-stone-800 text-white font-medium text-sm
                         hover:bg-stone-700 active:bg-stone-900 transition-colors
                         shadow-sm hover:shadow-md"
            >
              Create New Game
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-stone-200" />
              <span className="flex-shrink mx-4 text-stone-400 text-xs font-mono">OR</span>
              <div className="flex-grow border-t border-stone-200" />
            </div>

            <button
              onClick={() => setMode("join")}
              className="w-full py-3.5 px-4 rounded-xl bg-white border border-stone-300 text-stone-700 font-medium text-sm
                         hover:bg-stone-50 active:bg-stone-100 transition-colors"
            >
              Join Existing Game
            </button>

            {error && (
              <p className="text-red-600 text-sm text-center pt-2">{error}</p>
            )}
          </>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="gameId"
                className="block text-sm font-medium text-stone-600 mb-1.5"
              >
                Enter Game ID
              </label>
              <input
                id="gameId"
                type="text"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-800
                           text-lg tracking-[0.3em] text-center font-mono font-bold
                           placeholder:tracking-normal placeholder:font-normal placeholder:text-stone-300
                           focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent
                           transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("menu");
                  setGameIdInput("");
                }}
                className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-600 text-sm font-medium
                           hover:bg-stone-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={gameIdInput.trim().length < 4}
                className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium
                           hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed
                           transition-colors shadow-sm"
              >
                Join Game
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center pt-2">{error}</p>
            )}
          </form>
        )}
      </div>

      {/* Footer info */}
      <p className="mt-8 text-xs text-stone-400 text-center leading-relaxed max-w-xs">
        Everything runs in your browser.
        Your game disappears when both players leave.
      </p>
    </div>
  );
}
