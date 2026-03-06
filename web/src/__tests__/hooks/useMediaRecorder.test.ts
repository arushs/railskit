import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  state: "inactive" as string,
  ondataavailable: null as ((e: { data: Blob }) => void) | null,
  onstop: null as (() => void) | null,
  onerror: null as (() => void) | null,
};

// Mock AudioContext
const mockAnalyser = {
  fftSize: 0,
  frequencyBinCount: 128,
  getByteTimeDomainData: vi.fn(),
};

const mockAudioCtx = {
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn(),
  })),
  createAnalyser: vi.fn(() => mockAnalyser),
  close: vi.fn(),
};

// Mock MediaStream
const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
};

vi.stubGlobal(
  "MediaRecorder",
  vi.fn(() => {
    mockMediaRecorder.state = "recording";
    return mockMediaRecorder;
  })
);
(MediaRecorder as unknown as { isTypeSupported: (t: string) => boolean }).isTypeSupported =
  vi.fn(() => true);

vi.stubGlobal("AudioContext", vi.fn(() => mockAudioCtx));

const mockGetUserMedia = vi.fn(() => Promise.resolve(mockStream));
Object.defineProperty(navigator, "mediaDevices", {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

describe("useMediaRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaRecorder.state = "inactive";
  });

  it("starts with isRecording=false and no stream", () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.isRecording).toBe(false);
    expect(result.current.stream).toBeNull();
    expect(result.current.analyser).toBeNull();
  });

  it("starts recording and sets isRecording=true", async () => {
    const onStart = vi.fn();
    const { result } = renderHook(() => useMediaRecorder({ onStart }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({ echoCancellation: true }),
    });
    expect(onStart).toHaveBeenCalled();
  });

  it("calls onDataAvailable when audio chunk is produced", async () => {
    const onDataAvailable = vi.fn();
    const { result } = renderHook(() => useMediaRecorder({ onDataAvailable }));

    await act(async () => {
      await result.current.startRecording();
    });

    const testBlob = new Blob(["test"], { type: "audio/webm" });
    act(() => {
      mockMediaRecorder.ondataavailable?.({ data: testBlob });
    });

    expect(onDataAvailable).toHaveBeenCalledWith(testBlob);
  });

  it("stops recording and calls onStop with blob", async () => {
    const onStop = vi.fn();
    const { result } = renderHook(() => useMediaRecorder({ onStop }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate some data
    const testBlob = new Blob(["test"], { type: "audio/webm" });
    act(() => {
      mockMediaRecorder.ondataavailable?.({ data: testBlob });
    });

    act(() => {
      result.current.stopRecording();
    });

    // Simulate MediaRecorder.onstop
    act(() => {
      mockMediaRecorder.onstop?.();
    });

    expect(result.current.isRecording).toBe(false);
    expect(onStop).toHaveBeenCalledWith(expect.any(Blob));
  });

  it("handles getUserMedia rejection", async () => {
    const onError = vi.fn();
    mockGetUserMedia.mockRejectedValueOnce(new Error("Permission denied"));

    const { result } = renderHook(() => useMediaRecorder({ onError }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.isRecording).toBe(false);
  });
});
