import { VoiceChat } from "@/components/voice";
import { mockPresets, mockMessages } from "@/lib/mock-voice";

export default function VoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Voice Agents
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Real-time voice conversations with your AI agents
        </p>
      </div>

      <VoiceChat
        presets={mockPresets}
        initialPreset={mockPresets[0]}
        initialMessages={mockMessages}
        className="max-w-2xl"
      />
    </div>
  );
}
