import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";

// Mock AudioContext and related APIs
const mockSourceNode = {
  buffer: null as AudioBuffer | null,
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  onended: null as (() => void) | null,
};

const mockAnalyser = {
  fftSize: 0,
  frequencyBinCount: 128,
  getByteTimeDomainData: vi.fn(),
  connect: vi.fn(),
};

const mockAudioBuffer = {
  duration: 0.5,
  getChannelData: vi.fn(() => new Float32Array(8000)),
};

const mockAudioContext = {
  currentTime: 0,
  state: "running" as string,
  sampleRate: 16000,
  createBufferSource: vi.fn(() => ({ ...mockSourceNode })),
  createBuffer: vi.fn(() => ({ ...mockAudioBuffer })),
  createAnalyser: vi.fn(() => mockAnalyser),
  decodeAudioData: vi.fn(() => Promise.resolve(mockAudioBuffer)),
  destination: {},
  close: vi.fn(),
};

vi.stubGlobal("AudioContext", vi.fn(() => ({ ...mockAudioContext })));

// Mock atob/btoa
vi.stubGlobal("atob", vi.fn((_s: string) => {
  // Return a string that simulates 16 bytes of PCM data (8 samples)
  return String.fromCharCode(...new Uint8Array(16));
}));

describe("useAudioPlayback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with isPlaying=false", () => {
    const { result } = renderHook(() => useAudioPlayback());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.analyser).toBeNull();
  });

  it("sets isPlaying=true when audio is enqueued", () => {
    const onPlaybackStart = vi.fn();
    const { result } = renderHook(() =>
      useAudioPlayback({ onPlaybackStart })
    );

    act(() => {
      result.current.enqueue("AAAAAAAAAAAAAAAA", "pcm_16000");
    });

    expect(result.current.isPlaying).toBe(true);
    expect(onPlaybackStart).toHaveBeenCalled();
  });

  it("interrupts playback and clears queue", () => {
    const { result } = renderHook(() => useAudioPlayback());

    act(() => {
      result.current.enqueue("AAAAAAAAAAAAAAAA", "pcm_16000");
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.interrupt();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("creates analyser on first enqueue", () => {
    const { result } = renderHook(() => useAudioPlayback());

    act(() => {
      result.current.enqueue("AAAAAAAAAAAAAAAA", "pcm_16000");
    });

    // Analyser should be set after first audio context creation
    expect(result.current.analyser).not.toBeNull();
  });
});
