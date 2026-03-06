import { useCallback, useRef, useState } from "react";

export interface UseAudioPlaybackOptions {
  /** Sample rate for PCM playback (default: 16000) */
  sampleRate?: number;
  /** Called when playback starts */
  onPlaybackStart?: () => void;
  /** Called when playback queue drains (agent done speaking) */
  onPlaybackEnd?: () => void;
}

export interface UseAudioPlaybackReturn {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Enqueue a base64-encoded audio chunk for playback */
  enqueue: (audioBase64: string, format?: string) => void;
  /** Interrupt playback immediately (e.g., user started speaking) */
  interrupt: () => void;
  /** The AudioContext analyser for visualization */
  analyser: AnalyserNode | null;
}

/**
 * Audio playback engine that queues PCM chunks from ActionCable
 * and plays them through AudioContext. Supports interruption.
 */
export function useAudioPlayback(
  options: UseAudioPlaybackOptions = {}
): UseAudioPlaybackReturn {
  const { sampleRate = 16000, onPlaybackStart, onPlaybackEnd } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const queueRef = useRef<AudioBuffer[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const nextTimeRef = useRef(0);

  const cbRefs = useRef({ onPlaybackStart, onPlaybackEnd });
  cbRefs.current = { onPlaybackStart, onPlaybackEnd };

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const ctx = new AudioContext({ sampleRate });
      const node = ctx.createAnalyser();
      node.fftSize = 2048;
      node.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = node;
      setAnalyser(node);
    }
    return {
      ctx: audioCtxRef.current,
      analyser: analyserRef.current!,
    };
  }, [sampleRate]);

  const scheduleNext = useCallback(() => {
    const buffer = queueRef.current.shift();
    if (!buffer) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      cbRefs.current.onPlaybackEnd?.();
      return;
    }

    const { ctx, analyser: analyserNode } = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyserNode);
    currentSourceRef.current = source;

    const startTime = Math.max(ctx.currentTime, nextTimeRef.current);
    nextTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      if (currentSourceRef.current === source) {
        currentSourceRef.current = null;
        scheduleNext();
      }
    };

    source.start(startTime);
  }, [getAudioContext]);

  const enqueue = useCallback(
    (audioBase64: string, format: string = "pcm_16000") => {
      const { ctx } = getAudioContext();

      // Decode base64 to raw bytes
      const binaryStr = atob(audioBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      if (format.startsWith("pcm")) {
        // PCM 16-bit signed little-endian → Float32
        const pcm16 = new Int16Array(bytes.buffer);
        audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768;
        }
      } else {
        // For other formats, attempt decodeAudioData (async, but we'll buffer)
        ctx.decodeAudioData(bytes.buffer.slice(0)).then((decoded) => {
          queueRef.current.push(decoded);
          if (!isPlayingRef.current) {
            isPlayingRef.current = true;
            setIsPlaying(true);
            cbRefs.current.onPlaybackStart?.();
            scheduleNext();
          }
        });
        return;
      }

      queueRef.current.push(audioBuffer);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsPlaying(true);
        cbRefs.current.onPlaybackStart?.();
        nextTimeRef.current = 0;
        scheduleNext();
      }
    },
    [getAudioContext, sampleRate, scheduleNext]
  );

  const interrupt = useCallback(() => {
    // Stop current playback and clear queue
    queueRef.current = [];
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    nextTimeRef.current = 0;
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  return { isPlaying, enqueue, interrupt, analyser };
}
