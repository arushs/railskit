declare module "@ricky0123/vad-web" {
  export interface MicVADOptions {
    positiveSpeechThreshold?: number;
    negativeSpeechThreshold?: number;
    minSpeechFrames?: number;
    preSpeechPadFrames?: number;
    onSpeechStart?: () => void;
    onSpeechEnd?: (audio: Float32Array) => void;
    onVADMisfire?: () => void;
  }

  export interface MicVADInstance {
    start: () => void;
    pause: () => void;
    destroy: () => void;
  }

  export const MicVAD: {
    new: (options: MicVADOptions) => Promise<MicVADInstance>;
  };
}
