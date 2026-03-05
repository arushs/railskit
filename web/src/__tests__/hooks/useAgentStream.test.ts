import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAgentStream } from "@/hooks/useAgentStream";

// Mock ActionCable
const mockSubscription = {
  unsubscribe: vi.fn(),
  received: null as ((data: unknown) => void) | null,
};

const mockConsumer = {
  subscriptions: {
    create: vi.fn((_params: unknown, callbacks: { received: (data: unknown) => void }) => {
      mockSubscription.received = callbacks.received;
      return mockSubscription;
    }),
  },
  disconnect: vi.fn(),
};

vi.mock("@rails/actioncable", () => ({
  createConsumer: vi.fn(() => mockConsumer),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAgentStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscription.received = null;
  });

  it("starts with isStreaming=false and empty streamContent", () => {
    const { result } = renderHook(() => useAgentStream());
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamContent).toBe("");
  });

  it("sendMessage posts to the API and returns chat_id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ chat_id: "chat-123" }),
    });

    const { result } = renderHook(() => useAgentStream());

    let chatId: string | null = null;
    await act(async () => {
      chatId = await result.current.sendMessage("help_desk", "Hello");
    });

    expect(chatId).toBe("chat-123");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/agents/help_desk/stream"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("handles stream tokens and updates streamContent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ chat_id: "chat-456" }),
    });

    const onToken = vi.fn();
    const onComplete = vi.fn();

    const { result } = renderHook(() =>
      useAgentStream({ onToken, onComplete })
    );

    await act(async () => {
      await result.current.sendMessage("help_desk", "Hi");
    });

    // Simulate stream events
    act(() => {
      mockSubscription.received?.({ type: "stream_start" });
    });

    expect(result.current.isStreaming).toBe(true);

    act(() => {
      mockSubscription.received?.({ type: "stream_token", token: "Hello" });
    });
    act(() => {
      mockSubscription.received?.({ type: "stream_token", token: " world" });
    });

    expect(result.current.streamContent).toBe("Hello world");
    expect(onToken).toHaveBeenCalledTimes(2);

    act(() => {
      mockSubscription.received?.({
        type: "stream_end",
        model: "gpt-4o",
        usage: { input_tokens: 10, output_tokens: 5 },
      });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(onComplete).toHaveBeenCalledWith("Hello world", {
      model: "gpt-4o",
      usage: { input_tokens: 10, output_tokens: 5 },
    });
  });

  it("calls onError when API request fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Not authenticated" }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useAgentStream({ onError }));

    await act(async () => {
      const chatId = await result.current.sendMessage("help_desk", "Hi");
      expect(chatId).toBeNull();
    });

    expect(onError).toHaveBeenCalledWith("Not authenticated");
  });

  it("calls onError on stream_error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ chat_id: "chat-err" }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useAgentStream({ onError }));

    await act(async () => {
      await result.current.sendMessage("help_desk", "Hi");
    });

    act(() => {
      mockSubscription.received?.({ type: "stream_error", error: "Agent crashed" });
    });

    expect(onError).toHaveBeenCalledWith("Agent crashed");
    expect(result.current.isStreaming).toBe(false);
  });
});
