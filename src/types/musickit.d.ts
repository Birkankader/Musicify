// MusicKit JS type declarations
declare global {
  interface Window {
    MusicKit: typeof MusicKit;
  }

  namespace MusicKit {
    function configure(config: {
      developerToken: string;
      app: { name: string; build: string };
    }): Promise<MusicKitInstance>;

    function getInstance(): MusicKitInstance;

    interface MusicKitInstance {
      authorize(): Promise<string | undefined>;
      unauthorize(): Promise<void>;
      isAuthorized: boolean;
      musicUserToken: string;
      api: {
        music(
          path: string,
          queryParameters?: Record<string, unknown>,
          options?: { fetchOptions?: { method?: string; body?: string } }
        ): Promise<{ data: { data: unknown[] } }>;
      };
    }
  }
}

export {};
