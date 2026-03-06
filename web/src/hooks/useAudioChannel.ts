import { useCallback, useEffect, useRef, useState } from "react";
import { createConsumer, type Subscription } from "@rails/actioncable";

const API_BASE = import.meta.env.VITE_API_URL || "";
const WS_BASE = import.meta.env.VITE_WS_URL || API_BASE.replace(/^http/, "ws");

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "rejected";

export interface AudioChannelMessage {
  type:
    | "audio_chunk"
    | "transcript"
    | "agent_speaking"
    | "agent_done"
    | "error"
    | "vad_event";
  audio?: string; // base64 encoded
  format?: string; // e.g. "pcm_16000"
  text?: string;
  is_final?: boolean;
  event?: string;
  error?: string;
}

export interface UseAudioChannelOptions {
  chatId: string;
  token?: string;
  onAudioReceived?: (audioBase64: string, format: string) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAgentSpeaking?: () => void;
  onAgentDone?: () => void;
  onError?: (error: string) => void;
}

export interface UseAudioChannelReturn {
  /** Send an audio chunk to the server */
  sendAudio: (audioBase64: string) => void;
  /** Send a VAD event (speech_start / speech_end) */
  sendVadEvent: (event: "speech_start" | "speech_end") => void;
  /** Current connection state */
  connectionState: ConnectionState;
  /** Connect to the audio channel */
  connect: () => void;
  /** Disconnect from the audio channel */
  disconnect: () => void;
}

/**
 * Hook for bidirectional audio streaming over ActionCable.
 * Connects to the AudioChannel on the Rails backend.
 */
export function useAudioChannel(
  options: UseAudioChannelOptions
): UseAudioChannelReturn {
  const {
    chatId,
    token,
    onAudioReceived,
    onTranscript,
    onAgentSpeaking,
    onAgentDone,
    onError,
  } = options;

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  const consumerRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  // Stable callback refs
  const cbRefs = useRef({
    onAudioReceived,
    onTranscript,
    onAgentSpeaking,
    onAgentDone,
    onError,
  });
  cbRefs.current = {
    onAudioReceived,
    onTranscript,
    onAgentSpeaking,
    onAgentDone,
    onError,
  };

  const disconnect = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    consumerRef.current?.disconnect();
    consumerRef.current = null;
    setConnectionState("disconnected");
  }, []);

  const connect = useCallback(() => {
    disconnect();
    setConnectionState("connecting");

    const wsUrl = token
      ? `${WS_BASE}/cable?token=${encodeURIComponent(token)}`
      : `${WS_BASE}/cable`;

    const consumer = createConsumer(wsUrl);
    consumerRef.current = consumer;

    subscriptionRef.current = consumer.subscriptions.create(
      { channel: "AudioChannel", chat_id: chatId },
      {
        connected() {
          setConnectionState("connected");
        },
        disconnected() {
          setConnectionState("disconnected");
        },
        rejected() {
          setConnectionState("rejected");
          cbRefs.current.onError?.("Audio channel connection rejected");
        },
        received(data: AudioChannelMessage) {
          switch (data.type) {
            case "audio_chunk":
              if (data.audio) {
                cbRefs.current.onAudioReceived?.(
                  data.audio,
                  data.format || "pcm_16000"
                );
              }
              break;
            case "transcript":
              if (data.text !== undefined) {
                cbRefs.current.onTranscript?.(
                  data.text,
                  data.is_final ?? false
                );
              }
              break;
            case "agent_speaking":
              cbRefs.current.onAgentSpeaking?.();
              break;
            case "agent_done":
              cbRefs.current.onAgentDone?.();
              break;
            case "error":
              cbRefs.current.onError?.(data.error || "Unknown error");
              break;
          }
        },
      }
    );
  }, [chatId, token, disconnect]);

  const sendAudio = useCallback((audioBase64: string) => {
    subscriptionRef.current?.send({
      type: "audio_chunk",
      audio: audioBase64,
    });
  }, []);

  const sendVadEvent = useCallback(
    (event: "speech_start" | "speech_end") => {
      subscriptionRef.current?.send({
        type: "vad_event",
        event,
      });
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
      consumerRef.current?.disconnect();
    };
  }, []);

  return { sendAudio, sendVadEvent, connectionState, connect, disconnect };
}
