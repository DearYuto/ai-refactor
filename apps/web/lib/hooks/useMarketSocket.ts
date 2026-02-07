import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { marketQueryKeys } from "@/lib/api/market.query";
import type { MarketSource, Orderbook, Ticker } from "@/lib/api/market.types";
import { apiBaseUrl } from "@/lib/config";

type MarketUpdatePayload = {
  source: MarketSource;
  ticker: Ticker;
  orderbook: Orderbook;
  ts: number;
};

type MarketSocketStatus = "connected" | "disconnected" | "connecting";

export const useMarketSocket = (source: MarketSource) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const sourceRef = useRef<MarketSource>(source);
  const [status, setStatus] = useState<MarketSocketStatus>("connecting");

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    const socket = io(`${apiBaseUrl}/market`);
    socketRef.current = socket;

    const handleUpdate = (payload: MarketUpdatePayload) => {
      queryClient.setQueryData(
        marketQueryKeys.ticker(payload.source),
        payload.ticker,
      );
      queryClient.setQueryData(
        marketQueryKeys.orderbook(payload.source),
        payload.orderbook,
      );
    };

    const handleConnect = () => {
      setStatus("connected");
      socket.emit("market:source", sourceRef.current);
    };

    const handleDisconnect = () => {
      setStatus("disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("market:update", handleUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("market:update", handleUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }
    socket.emit("market:source", source);
  }, [source]);

  return status;
};
