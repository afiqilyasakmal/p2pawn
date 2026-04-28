"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, Square } from "chess.js";
import { usePeerConnection } from "@/hooks/usePeerConnection";
import { Lobby } from "@/components/Lobby";
import { WaitingRoom } from "@/components/WaitingRoom";
import { GameBoard } from "@/components/GameBoard";
import { ConnectionStatusBar } from "@/components/ConnectionStatusBar";
import { MoveHistory } from "@/components/MoveHistory";

type GamePhase = "lobby" | "waiting" | "playing" | "ended";

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [chess, setChess] = useState<Chess>(() => new Chess());
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [gameOverReason, setGameOverReason] = useState("");

  // Keep a ref to chess so callbacks always have the latest state
  const chessRef = useRef(chess);
  chessRef.current = chess;

  const onMoveReceived = useCallback(
    (move: { from: string; to: string; promotion?: string; fen: string; pgn: string }) => {
      const game = chessRef.current;
      try {
        const result = game.move({
          from: move.from as Square,
          to: move.to as Square,
          promotion: (move.promotion as "q" | "r" | "n" | "b") || undefined,
        });
        if (result) {
          setChess(new Chess(game.fen()));
          setLastMove({ from: move.from, to: move.to });

          // Check game over
          if (game.isGameOver()) {
            setPhase("ended");
            if (game.isCheckmate()) setGameOverReason("Checkmate!");
            else if (game.isDraw()) setGameOverReason("Draw");
            else if (game.isStalemate()) setGameOverReason("Stalemate");
            else if (game.isThreefoldRepetition()) setGameOverReason("Draw by repetition");
            else setGameOverReason("Game over");
          }
        }
      } catch {
        // Invalid move from peer — ignore
      }
    },
    []
  );

  const onPeerDisconnected = useCallback(() => {
    setPhase("ended");
    setGameOverReason("Opponent disconnected");
  }, []);

  const onConnectionEstablished = useCallback((role: "host" | "joiner" | null) => {
    setPhase("playing");
    setOrientation(role === "host" ? "white" : "black");
    setChess(new Chess());
    setLastMove(null);
    setGameOverReason("");
  }, []);

  const onError = useCallback((_error: string) => {
    // Errors are already surfaced via `error` state in usePeerConnection
  }, []);

  const {
    peerId,
    status,
    role,
    error,
    waitingExpired,
    createGame,
    joinGame,
    sendMove,
    disconnect,
    reset,
  } = usePeerConnection({
    onMoveReceived,
    onPeerDisconnected,
    onConnectionEstablished,
    onError,
  });

  // Handle creating a game
  const handleCreateGame = useCallback(() => {
    createGame();
  }, [createGame]);

  // Move to waiting phase once peerId (Game ID) is available
  useEffect(() => {
    if (peerId && status === "connecting" && role === "host") {
      setPhase("waiting");
    }
  }, [peerId, status, role]);

  // Handle waiting expired
  useEffect(() => {
    if (waitingExpired) {
      setPhase("lobby");
    }
  }, [waitingExpired]);

  // Handle local move
  const handleLocalMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      const game = chessRef.current;
      try {
        const move = game.move({
          from: from as Square,
          to: to as Square,
          promotion: promotion as "q" | "r" | "n" | "b" | undefined,
        });
        if (move) {
          // Update local state
          setChess(new Chess(game.fen()));
          setLastMove({ from, to });

          // Send move to peer
          sendMove({
            from,
            to,
            promotion,
            fen: game.fen(),
            pgn: game.pgn(),
          });

          // Check game over
          if (game.isGameOver()) {
            setPhase("ended");
            if (game.isCheckmate()) setGameOverReason("Checkmate!");
            else if (game.isDraw()) setGameOverReason("Draw");
            else if (game.isStalemate()) setGameOverReason("Stalemate");
            else if (game.isThreefoldRepetition()) setGameOverReason("Draw by repetition");
            else setGameOverReason("Game over");
          }
        }
      } catch {
        // Invalid move — shouldn't happen
      }
    },
    [sendMove]
  );

  // Handle leaving/returning to lobby
  const handleLeave = useCallback(() => {
    disconnect();
    setPhase("lobby");
    setChess(new Chess());
    setLastMove(null);
    setGameOverReason("");
  }, [disconnect]);

  const handleCancelWaiting = useCallback(() => {
    reset();
    setPhase("lobby");
    setChess(new Chess());
    setLastMove(null);
    setGameOverReason("");
  }, [reset]);

  const isCheck = chess.isCheck() && !chess.isGameOver();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-light text-stone-700 tracking-tight">
            P2Pawn
          </h1>
          {phase !== "lobby" && (
            <div className="flex items-center gap-3">
              <ConnectionStatusBar status={status} role={role} />
              <button
                onClick={handleLeave}
                className="text-xs text-stone-500 hover:text-red-600 transition-colors font-medium"
              >
                Leave
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        {phase === "lobby" && (
          <Lobby
            onCreateGame={handleCreateGame}
            onJoinGame={joinGame}
            error={error}
          />
        )}

        {phase === "waiting" && peerId && (
          <WaitingRoom
            gameId={peerId}
            waitingExpired={waitingExpired}
            onCancel={handleCancelWaiting}
          />
        )}

        {phase === "playing" && (
          <div className="w-full max-w-[500px] mx-auto space-y-4">
            <GameBoard
              chess={chess}
              role={role}
              status={status}
              orientation={orientation}
              onMove={handleLocalMove}
              lastMove={lastMove}
              isCheck={isCheck}
              gameOver={false}
              gameOverReason=""
            />
            <MoveHistory chess={chess} />
          </div>
        )}

        {phase === "ended" && (
          <div className="w-full max-w-[500px] mx-auto space-y-4">
            <GameBoard
              chess={chess}
              role={role}
              status={status}
              orientation={orientation}
              onMove={handleLocalMove}
              lastMove={lastMove}
              isCheck={isCheck}
              gameOver={true}
              gameOverReason={gameOverReason}
            />
            <MoveHistory chess={chess} />

            <div className="flex justify-center">
              <button
                onClick={handleLeave}
                className="px-6 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium
                           hover:bg-stone-700 transition-colors shadow-sm"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

