"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export type PlayerRole = "host" | "joiner" | null;

export type MessageType =
  | { type: "move"; from: string; to: string; promotion?: string; fen: string; pgn: string }
  | { type: "game_state"; fen: string; pgn: string }
  | { type: "handshake"; role: "host" | "joiner" }
  | { type: "handshake_ack" }
  | { type: "error"; message: string };

interface UsePeerConnectionOptions {
  onMoveReceived?: (move: { from: string; to: string; promotion?: string; fen: string; pgn: string }) => void;
  onPeerDisconnected?: () => void;
  onConnectionEstablished?: (role: PlayerRole) => void;
  onError?: (error: string) => void;
}

interface UsePeerConnectionReturn {
  // State
  peerId: string | null;
  status: ConnectionStatus;
  role: PlayerRole;
  error: string | null;
  waitingExpired: boolean;

  // Actions
  createGame: () => void;
  joinGame: (gameId: string) => void;
  sendMove: (move: { from: string; to: string; promotion?: string; fen: string; pgn: string }) => void;
  disconnect: () => void;
  reset: () => void;
}

/**
 * Generates a short, human-friendly game ID (6 uppercase alphanumeric chars).
 */
function generateGameId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Ambiguous chars removed (0,O,1,I)
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const WAITING_TIMEOUT_MS = 45_000;

export function usePeerConnection(options: UsePeerConnectionOptions = {}): UsePeerConnectionReturn {
  const {
    onMoveReceived,
    onPeerDisconnected,
    onConnectionEstablished,
    onError,
  } = options;

  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [role, setRole] = useState<PlayerRole>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitingExpired, setWaitingExpired] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDestroyedRef = useRef(false);

  // ---------- Cleanup helpers ----------

  const clearWaitingTimer = useCallback(() => {
    if (waitingTimerRef.current !== null) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
  }, []);

  const destroyPeer = useCallback(() => {
    isDestroyedRef.current = true;
    clearWaitingTimer();

    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  }, [clearWaitingTimer]);

  // ---------- Connection setup ----------

  const setupDataConnection = useCallback(
    (conn: DataConnection, assignedRole: PlayerRole) => {
      connRef.current = conn;

      conn.on("data", (data: unknown) => {
        const message = data as MessageType;

        switch (message.type) {
          case "move":
            onMoveReceived?.(message);
            break;

          case "game_state":
            // Joiner receives initial state
            break;

          case "handshake":
            // Host receives handshake from joiner
            if (assignedRole === "host") {
              conn.send({ type: "handshake_ack" } as MessageType);
            }
            break;

          case "handshake_ack":
            // Joiner receives confirmation
            break;

          case "error":
            setError(message.message);
            onError?.(message.message);
            break;
        }
      });

      conn.on("close", () => {
        setStatus("disconnected");
        connRef.current = null;
        onPeerDisconnected?.();
      });

      conn.on("error", (err) => {
        setError(err.message);
        setStatus("error");
        onError?.(err.message);
      });
    },
    [clearWaitingTimer, onError, onMoveReceived, onPeerDisconnected]
  );

  // ---------- Create Game (Host) ----------

  const createGame = useCallback(() => {
    destroyPeer();
    isDestroyedRef.current = false;

    const id = generateGameId();
    const peer = new Peer(id, {
      debug: 0,
    });

    peerRef.current = peer;
    setPeerId(id);
    setStatus("connecting");
    setRole("host");
    setError(null);
    setWaitingExpired(false);

    peer.on("open", (_id) => {
      if (isDestroyedRef.current) return;
      setPeerId(_id);
      setStatus("connecting");

      // Start waiting timer
      waitingTimerRef.current = setTimeout(() => {
        if (!connRef.current && !isDestroyedRef.current) {
          setWaitingExpired(true);
          setError("No one joined. Session expired.");
          setStatus("error");
          destroyPeer();
        }
      }, WAITING_TIMEOUT_MS);
    });

    peer.on("connection", (conn) => {
      if (isDestroyedRef.current) return;

      // Prevent third player from joining
      if (connRef.current) {
        conn.send({
          type: "error",
          message: "Game in progress. This room is already full.",
        } as MessageType);
        conn.close();
        return;
      }

      clearWaitingTimer();

      // Wait for data channel to fully open before signalling connection
      conn.on("open", () => {
        if (isDestroyedRef.current) return;
        setStatus("connected");
        conn.send({ type: "handshake", role: "host" } as MessageType);
        setupDataConnection(conn, "host");
        onConnectionEstablished?.("host");
      });

      // Timeout: surface error if data channel never opens
      const connTimeout = setTimeout(() => {
        if (!conn.open && !isDestroyedRef.current) {
          setError("Failed to establish connection with opponent.");
          setStatus("error");
          onError?.("Data channel did not open on host side.");
        }
      }, 15_000);

      conn.on("close", () => clearTimeout(connTimeout));
    });

    peer.on("disconnected", () => {
      if (!isDestroyedRef.current) {
        setStatus("disconnected");
      }
    });

    peer.on("error", (err) => {
      if (isDestroyedRef.current) return;

      // Handle duplicate ID
      if (err.message?.includes("ID is taken") || (err as any).type === "unavailable-id") {
        // Retry with a new ID
        createGame();
        return;
      }

      setError(err.message);
      setStatus("error");
      onError?.(err.message);
    });
  }, [clearWaitingTimer, destroyPeer, onConnectionEstablished, onError, setupDataConnection]);

  // ---------- Join Game (Joiner) ----------

  const joinGame = useCallback(
    (gameId: string) => {
      destroyPeer();
      isDestroyedRef.current = false;

      const sanitizedId = gameId.trim().toUpperCase();
      if (!sanitizedId) {
        setError("Please enter a valid Game ID.");
        return;
      }

      const peer = new Peer();

      peerRef.current = peer;
      setStatus("connecting");
      setRole("joiner");
      setError(null);
      setWaitingExpired(false);

      peer.on("open", () => {
        if (isDestroyedRef.current) return;

        const conn = peer.connect(sanitizedId, {
          reliable: true,
        });

        // Guard against peer.connect() returning undefined
        if (!conn) {
          setError("Failed to initiate connection. Please try again.");
          setStatus("error");
          onError?.("peer.connect() returned undefined");
          return;
        }

        // Timeout: surface error if data channel never opens
        const connTimeout = setTimeout(() => {
          if (!conn.open && !isDestroyedRef.current) {
            setError("Failed to establish connection with host.");
            setStatus("error");
            onError?.("Data channel did not open on joiner side.");
          }
        }, 15_000);

        conn.on("open", () => {
          if (isDestroyedRef.current) return;
          clearTimeout(connTimeout);

          // Send handshake
          conn.send({ type: "handshake", role: "joiner" } as MessageType);
          setupDataConnection(conn, "joiner");
          onConnectionEstablished?.("joiner");
        });

        conn.on("close", () => clearTimeout(connTimeout));

        conn.on("error", (err) => {
          clearTimeout(connTimeout);
          setError(err.message);
          setStatus("error");
          onError?.(err.message);
        });
      });

      peer.on("error", (err) => {
        if (isDestroyedRef.current) return;

        // PeerJS throws "Could not connect to peer" if the ID doesn't exist
        if (
          err.message?.includes("Could not connect") ||
          (err as any).type === "peer-unavailable"
        ) {
          setError("Invalid Game ID. No game found with this ID.");
        } else {
          setError(err.message);
        }
        setStatus("error");
        onError?.(err.message);
      });

      peer.on("disconnected", () => {
        if (!isDestroyedRef.current) {
          setStatus("disconnected");
        }
      });
    },
    [destroyPeer, onConnectionEstablished, onError, setupDataConnection]
  );

  // ---------- Send Move ----------

  const sendMove = useCallback(
    (move: { from: string; to: string; promotion?: string; fen: string; pgn: string }) => {
      if (connRef.current?.open) {
        connRef.current.send({ type: "move", ...move } as MessageType);
      }
    },
    []
  );

  // ---------- Disconnect / Reset ----------

  const disconnect = useCallback(() => {
    destroyPeer();
    setPeerId(null);
    setStatus("disconnected");
    setRole(null);
    setError(null);
    setWaitingExpired(false);
  }, [destroyPeer]);

  const reset = useCallback(() => {
    destroyPeer();
    setPeerId(null);
    setStatus("idle");
    setRole(null);
    setError(null);
    setWaitingExpired(false);
  }, [destroyPeer]);

  // ---------- Cleanup on unmount ----------

  useEffect(() => {
    return () => {
      destroyPeer();
    };
  }, [destroyPeer]);

  return {
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
  };
}
