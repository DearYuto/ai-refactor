import { useEffect, useRef } from "react";
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

export const useMarketSocket = (source: MarketSource) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const sourceRef = useRef<MarketSource>(source);

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
      socket.emit("market:source", sourceRef.current);
    };

    socket.on("connect", handleConnect);
    socket.on("market:update", handleUpdate);

    return () => {
      socket.off("connect", handleConnect);
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
};
