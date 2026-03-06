import type { VoicePreset, VoiceMessage } from "@/types/voice";

export const mockVoicePresets: VoicePreset[] = [
  {
    id: "preset-1",
    name: "Nova",
    description: "Warm, professional female voice. Great for customer support and onboarding flows.",
    provider: "elevenlabs",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    tags: ["warm", "professional", "female"],
    config: { stability: 0.7, similarity: 0.8, speed: 1.0 },
  },
  {
    id: "preset-2",
    name: "Atlas",
    description: "Deep, authoritative male voice. Ideal for announcements and serious content.",
    provider: "elevenlabs",
    voiceId: "IKne3meq5aSn9XLyUdCD",
    tags: ["deep", "authoritative", "male"],
    config: { stability: 0.8, similarity: 0.75, speed: 0.95 },
  },
  {
    id: "preset-3",
    name: "Shimmer",
    description: "Bright, energetic voice with a friendly tone. Perfect for marketing and demos.",
    provider: "openai",
    voiceId: "shimmer",
    tags: ["bright", "energetic", "friendly"],
    config: { speed: 1.05 },
  },
  {
    id: "preset-4",
    name: "Echo",
    description: "Calm, measured voice with natural pacing. Works well for technical explanations.",
    provider: "openai",
    voiceId: "echo",
    tags: ["calm", "measured", "technical"],
    config: { speed: 0.9 },
  },
  {
    id: "preset-5",
    name: "Aura",
    description: "Natural conversational voice with low latency. Optimized for real-time chat.",
    provider: "deepgram",
    voiceId: "aura-asteria-en",
    tags: ["natural", "conversational", "low-latency"],
    config: { speed: 1.0 },
  },
  {
    id: "preset-6",
    name: "Custom Fine-tune",
    description: "Your own cloned or fine-tuned voice model. Upload audio samples to create.",
    provider: "custom",
    voiceId: "custom-v1",
    tags: ["custom", "cloned"],
    config: { stability: 0.6, similarity: 0.9, speed: 1.0 },
  },
];

export const mockVoiceMessages: VoiceMessage[] = [
  {
    id: "vm-1",
    role: "user",
    content: "Hey, can you help me understand how the billing system works?",
    duration: 3.2,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "vm-2",
    role: "assistant",
    content:
      "Of course! The billing system uses Stripe for payment processing. You can set up subscription plans with monthly or annual billing cycles. Each plan can have usage-based add-ons that meter API calls, storage, or any custom metric you define.",
    duration: 8.5,
    timestamp: new Date(Date.now() - 105000).toISOString(),
  },
  {
    id: "vm-3",
    role: "user",
    content: "What about handling failed payments?",
    duration: 2.1,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "vm-4",
    role: "assistant",
    content:
      "Great question. RailsKit includes automatic retry logic via Stripe webhooks. When a payment fails, it sends up to 3 retry attempts over 7 days. Customers get email notifications at each stage, and you can configure grace periods before downgrading access.",
    duration: 10.2,
    timestamp: new Date(Date.now() - 45000).toISOString(),
  },
];
