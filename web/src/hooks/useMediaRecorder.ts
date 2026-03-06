import { useCallback, useRef, useState } from "react";

export interface UseMediaRecorderOptions {
  /** Audio MIME type (default: audio/webm;codecs=opus) */
  mimeType?: string;
  /** Time slice in ms for ondataavailable (default: 250) */
  timeSlice?: number;
  /** Called with each audio chunk */
  onDataAvailable?: (chunk: Blob) => void;
  /** Called when recording starts */
  onStart?: () => void;
  /** Called when recording stops with full blob */
  onStop?: (blob: Blob) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UseMediaRecorderReturn {
  /** Whether the microphone is currently recording */
  isRecording: boolean;
  /** Start recording from microphone */
  startRecording: () => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** The active MediaStream (null when not recording) */
  stream: MediaStream | null;
  /** The underlying AnalyserNode for visualization */
  analyser: AnalyserNode | null;
}

/**
 * Hook for microphone access and recording via MediaRecorder API.
 * Provides audio chunks suitable for streaming over ActionCable.
 */
export function useMediaRecorder(
  options: UseMediaRecorderOptions = {}
): UseMediaRecorderReturn {
  const {
    mimeType = "audio/webm;codecs=opus",
    timeSlice = 250,
    onDataAvailable,
    onStart,
    onStop,
    onError,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Set up AudioContext + AnalyserNode for waveform visualization
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      source.connect(analyserNode);
      audioCtxRef.current = audioCtx;
      setAnalyser(analyserNode);

      const useMimeType = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : "audio/webm";

      const recorder = new MediaRecorder(mediaStream, {
        mimeType: useMimeType,
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          onDataAvailable?.(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: useMimeType });
        onStop?.(blob);
        chunksRef.current = [];

        // Clean up stream tracks
        mediaStream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        setStream(null);
        setAnalyser(null);
        setIsRecording(false);
      };

      recorder.onerror = () => {
        onError?.(new Error("MediaRecorder error"));
        setIsRecording(false);
      };

      recorderRef.current = recorder;
      setStream(mediaStream);
      recorder.start(timeSlice);
      setIsRecording(true);
      onStart?.();
    } catch (err) {
      onError?.(
        err instanceof Error ? err : new Error("Microphone access denied")
      );
    }
  }, [mimeType, timeSlice, onDataAvailable, onStart, onStop, onError]);

  const stopRecording = useCallback(() => {
    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  return { isRecording, startRecording, stopRecording, stream, analyser };
}
