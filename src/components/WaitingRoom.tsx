"use client";

import { useEffect, useState } from "react";

interface WaitingRoomProps {
  gameId: string;
  waitingExpired: boolean;
  onCancel: () => void;
}

export function WaitingRoom({ gameId, waitingExpired, onCancel }: WaitingRoomProps) {
  const [countdown, setCountdown] = useState(45);

  useEffect(() => {
    if (waitingExpired) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [waitingExpired]);

  // Reset countdown if gameId changes
  useEffect(() => {
    setCountdown(45);
  }, [gameId]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-stone-800 mb-2">Waiting for opponent...</h2>
        <p className="text-stone-500 text-sm">
          Share the Game ID below with a friend.
        </p>
      </div>

      {/* Game ID Display */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-6">
        {/* ID */}
        <div className="text-center">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
            Game ID
          </label>
          <div className="inline-block px-6 py-3 bg-stone-100 rounded-xl">
            <span className="text-3xl tracking-[0.4em] font-bold font-mono text-stone-800 select-all">
              {gameId}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-amber-700 text-sm font-medium">
              {waitingExpired
                ? "Session expired"
                : `Session expires in ${countdown}s`}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-stone-400 text-xs text-center leading-relaxed">
          Tell your opponent to open the app and enter this Game ID to join.
        </p>

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="w-full py-2.5 rounded-xl border border-stone-300 text-stone-600 text-sm font-medium
                     hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Waiting animation */}
      <div className="mt-8 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
