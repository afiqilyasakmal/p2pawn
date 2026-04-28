"use client";

import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useCallback, useMemo } from "react";
import type { ConnectionStatus, PlayerRole } from "@/hooks/usePeerConnection";
import type { PieceDropHandlerArgs } from "react-chessboard";

interface GameBoardProps {
  chess: Chess;
  role: PlayerRole;
  status: ConnectionStatus;
  orientation: "white" | "black";
  onMove: (from: string, to: string, promotion?: string) => void;
  lastMove: { from: string; to: string } | null;
  isCheck: boolean;
  gameOver: boolean;
  gameOverReason: string;
}

export function GameBoard({
  chess,
  role,
  status,
  orientation,
  onMove,
  lastMove,
  isCheck,
  gameOver,
  gameOverReason,
}: GameBoardProps) {
  // Build custom square styles for last move highlight
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(255, 255, 100, 0.4)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(255, 255, 100, 0.4)",
      };
    }

    // Highlight the king in check
    if (isCheck) {
      const kingSquare = chess.turn() === "w"
        ? chess.board().flat().find((p) => p?.type === "k" && p.color === "w")?.square
        : chess.board().flat().find((p) => p?.type === "k" && p.color === "b")?.square;
      if (kingSquare) {
        styles[kingSquare] = {
          ...styles[kingSquare],
          background:
            "radial-gradient(ellipse at center, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0.3) 40%, transparent 70%)",
        };
      }
    }

    return styles;
  }, [chess, lastMove, isCheck]);

  const canDrag = useCallback(
    ({ piece }: { piece: { pieceType: string } }) => {
      if (!piece) return false;
      if (gameOver || status !== "connected") return false;

      // Determine which color this player controls
      const isHostWhite = orientation === "white";
      const isPlayersTurn =
        (isHostWhite && chess.turn() === "w") ||
        (!isHostWhite && chess.turn() === "b");

      if (!isPlayersTurn) return false;

      // pieceType is like "wP" (white pawn) or "bR" (black rook)
      const isWhitePiece = piece.pieceType.startsWith("w");
      return isHostWhite ? isWhitePiece : !isWhitePiece;
    },
    [chess, gameOver, status, orientation]
  );

  const onPieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (!targetSquare) return false;

      // Simple promotion detection: pawn reaching last rank
      const isPawn = piece.pieceType.endsWith("P");
      const promotion =
        isPawn && targetSquare[1] === "8"
          ? "q"
          : isPawn && targetSquare[1] === "1"
            ? "q"
            : undefined;

      onMove(sourceSquare, targetSquare, promotion);
      return true;
    },
    [onMove]
  );

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <div className="max-w-full">
        <Chessboard
          options={{
            position: chess.fen(),
            boardOrientation: orientation,
            boardStyle: {
              borderRadius: "8px",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)",
            },
            darkSquareStyle: { backgroundColor: "#b58863" },
            lightSquareStyle: { backgroundColor: "#f0d9b5" },
            squareStyles,
            showNotation: true,
            animationDurationInMs: 200,
            showAnimations: true,
            canDragPiece: canDrag as any,
            onPieceDrop: onPieceDrop as any,
            allowDragging: status === "connected" && !gameOver,
          }}
        />
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg backdrop-blur-sm z-10">
          <div className="bg-white/95 rounded-xl px-6 py-4 shadow-lg text-center">
            <p className="text-lg font-semibold text-stone-800">
              {gameOverReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
