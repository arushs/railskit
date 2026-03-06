import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Settings2, BarChart3 } from "lucide-react";
import { VoiceChat, VoicePresetPicker, WaveformVisualizer } from "@/components/voice";
import { mockVoicePresets, mockVoiceMessages } from "@/lib/mock-voice";
import type { VoicePreset, VoiceMessage, VoiceStatus } from "@/types/voice";

export default function VoicePage() {
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset | null>(
    mockVoicePresets[0]
  );
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleStartSession = useCallback(() => {
    setStatus("connecting");
    // Simulate connection flow
    setTimeout(() => setStatus("listening"), 1500);
    // Simulate a conversation after a short delay
    setTimeout(() => {
      setMessages(mockVoiceMessages);
      setStatus("speaking");
      setTimeout(() => setStatus("listening"), 3000);
    }, 4000);
  }, []);

  const handleEndSession = useCallback(() => {
    setStatus("idle");
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  // Mock stats
  const stats = [
    { label: "Total Sessions", value: "47" },
    { label: "Avg Duration", value: "3m 24s" },
    { label: "Audio Processed", value: "2.4 hrs" },
    { label: "Active Presets", value: String(mockVoicePresets.length) },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Voice Agents
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Real-time voice conversations with AI agents. Configure presets,
            monitor sessions, and fine-tune voice parameters.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs dark:border-zinc-700 dark:text-zinc-400"
        >
          <Mic className="mr-1 h-3 w-3" />
          WebSocket + STT/TTS
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <Card key={label} className="dark:bg-zinc-900/50 bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="dark:bg-zinc-800/50">
          <TabsTrigger value="chat" className="gap-1.5">
            <Mic className="h-3.5 w-3.5" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="presets" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Voice Presets
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chat area — 2/3 */}
            <div className="lg:col-span-2">
              <VoiceChat
                messages={messages}
                status={status}
                activePreset={selectedPreset}
                onStartSession={handleStartSession}
                onEndSession={handleEndSession}
                onToggleMute={handleToggleMute}
                isMuted={isMuted}
                onOpenSettings={() => setShowSettings(!showSettings)}
              />
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-4">
              <Card className="dark:bg-zinc-900/50 bg-white">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-zinc-700 dark:text-zinc-300">
                    Active Preset
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {selectedPreset ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          {selectedPreset.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {selectedPreset.description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {selectedPreset.config.stability !== undefined && (
                          <ConfigSlider
                            label="Stability"
                            value={selectedPreset.config.stability}
                          />
                        )}
                        {selectedPreset.config.similarity !== undefined && (
                          <ConfigSlider
                            label="Similarity"
                            value={selectedPreset.config.similarity}
                          />
                        )}
                        {selectedPreset.config.speed !== undefined && (
                          <ConfigSlider
                            label="Speed"
                            value={selectedPreset.config.speed}
                            max={2}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">No preset selected</p>
                  )}
                </CardContent>
              </Card>

              {/* Waveform demo card */}
              <Card className="dark:bg-zinc-900/50 bg-white">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-zinc-700 dark:text-zinc-300">
                    Waveform Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {(
                    ["idle", "listening", "speaking", "processing"] as VoiceStatus[]
                  ).map((s) => (
                    <div key={s} className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                        {s}
                      </span>
                      <WaveformVisualizer status={s} height={24} bars={30} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="presets">
          <Card className="dark:bg-zinc-900/50 bg-white">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-zinc-900 dark:text-white">
                Voice Presets
              </CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Select a voice for your agent. Each preset defines the voice
                provider, model, and tuning parameters.
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <VoicePresetPicker
                presets={mockVoicePresets}
                selected={selectedPreset}
                onSelect={setSelectedPreset}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="dark:bg-zinc-900/50 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-4" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Voice Analytics
              </p>
              <p className="mt-1 text-xs text-zinc-400 max-w-[300px] text-center">
                Session duration, latency metrics, and usage breakdowns will
                appear here once you start making voice calls.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Simple read-only config slider display */
function ConfigSlider({
  label,
  value,
  max = 1,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500 font-mono">
          {max === 1 ? `${(value * 100).toFixed(0)}%` : `${value}×`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
