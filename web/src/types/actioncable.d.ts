declare module "@rails/actioncable" {
  export interface Subscription {
    perform(action: string, data?: Record<string, unknown>): void;
    unsubscribe(): void;
    send(data: unknown): boolean;
  }

  export interface SubscriptionCallbacks {
    connected?(): void;
    disconnected?(): void;
    rejected?(): void;
    received?(data: unknown): void;
    initialized?(): void;
  }

  export interface Subscriptions {
    create(
      channel: string | Record<string, unknown>,
      callbacks: SubscriptionCallbacks
    ): Subscription;
  }

  export interface Consumer {
    subscriptions: Subscriptions;
    connect(): void;
    disconnect(): void;
    send(data: unknown): void;
  }

  export function createConsumer(url?: string): Consumer;
  export function getConfig(name: string): string | undefined;
}
