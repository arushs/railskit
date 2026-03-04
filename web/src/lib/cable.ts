import { createConsumer, type Consumer } from "@rails/actioncable";

const API_URL = import.meta.env.VITE_API_URL || "";
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, "ws");

let consumer: Consumer | null = null;

/**
 * Get or create the ActionCable consumer.
 * Appends the JWT token as a query param for WebSocket auth.
 */
export function getConsumer(token?: string): Consumer {
  if (consumer) return consumer;

  const url = token ? `${WS_URL}/cable?token=${token}` : `${WS_URL}/cable`;
  consumer = createConsumer(url);
  return consumer;
}

/**
 * Disconnect and reset the consumer (e.g., on logout).
 */
export function disconnectConsumer(): void {
  if (consumer) {
    consumer.disconnect();
    consumer = null;
  }
}
