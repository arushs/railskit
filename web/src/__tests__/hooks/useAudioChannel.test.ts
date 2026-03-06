import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioChannel } from "@/hooks/useAudioChannel";

// Mock ActionCable
const mockSubscription = {
  unsubscribe: vi.fn(),
  send: vi.fn(),
  received: null as ((data: unknown) => void) | null,
  connected: null as (() => void) | null,
  disconnected: null as (() => void) | null,
  rejected: null as (() => void) | null,
};

const mockConsumer = {
  subscriptions: {
    create: vi.fn(
      (
        _params: unknown,
        callbacks: {
          received: (data: unknown) => void;
          connected: () => void;
          disconnected: () => void;
          rejected: () => void;
        }
      ) => {
        mockSubscription.received = callbacks.received;
        mockSubscription.connected = callbacks.connected;
        mockSubscription.disconnected = callbacks.disconnected;
        mockSubscription.rejected = callbacks.rejected;
        return mockSubscription;
      }
    ),
  },
  disconnect: vi.fn(),
};

vi.mock("@rails/actioncable", () => ({
  createConsumer: vi.fn(() => mockConsumer),
}));

describe("useAudioChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscription.received = null;
    mockSubscription.connected = null;
  });

  it("starts disconnected", () => {
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1" })
    );
    expect(result.current.connectionState).toBe("disconnected");
  });

  it("connects and sets state to connected", () => {
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1" })
    );

    act(() => {
      result.current.connect();
    });

    expect(mockConsumer.subscriptions.create).toHaveBeenCalledWith(
      { channel: "AudioChannel", chat_id: "chat-1" },
      expect.any(Object)
    );

    // Simulate connected callback
    act(() => {
      mockSubscription.connected?.();
    });

    expect(result.current.connectionState).toBe("connected");
  });

  it("sends audio chunks", () => {
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1" })
    );

    act(() => {
      result.current.connect();
      mockSubscription.connected?.();
    });

    act(() => {
      result.current.sendAudio("dGVzdA==");
    });

    expect(mockSubscription.send).toHaveBeenCalledWith({
      type: "audio_chunk",
      audio: "dGVzdA==",
    });
  });

  it("sends VAD events", () => {
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1" })
    );

    act(() => {
      result.current.connect();
    });

    act(() => {
      result.current.sendVadEvent("speech_start");
    });

    expect(mockSubscription.send).toHaveBeenCalledWith({
      type: "vad_event",
      event: "speech_start",
    });
  });

  it("calls onAudioReceived when audio_chunk message arrives", () => {
    const onAudioReceived = vi.fn();
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1", onAudioReceived })
    );

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockSubscription.received?.({
        type: "audio_chunk",
        audio: "YXVkaW8=",
        format: "pcm_16000",
      });
    });

    expect(onAudioReceived).toHaveBeenCalledWith("YXVkaW8=", "pcm_16000");
  });

  it("calls onTranscript on transcript messages", () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1", onTranscript })
    );

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockSubscription.received?.({
        type: "transcript",
        text: "Hello world",
        is_final: true,
      });
    });

    expect(onTranscript).toHaveBeenCalledWith("Hello world", true);
  });

  it("handles rejection", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1", onError })
    );

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockSubscription.rejected?.();
    });

    expect(result.current.connectionState).toBe("rejected");
    expect(onError).toHaveBeenCalledWith("Audio channel connection rejected");
  });

  it("disconnects cleanly", () => {
    const { result } = renderHook(() =>
      useAudioChannel({ chatId: "chat-1" })
    );

    act(() => {
      result.current.connect();
      mockSubscription.connected?.();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connectionState).toBe("disconnected");
    expect(mockConsumer.disconnect).toHaveBeenCalled();
  });
});
