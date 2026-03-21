import { useCallback, useRef, useState, type RefObject } from "react";

interface SSEOptions<T> {
  onMessage: (data: T, prevContent: string) => string;
  onDone?: (data: T) => boolean;
  onComplete?: (finalContent: string) => void;
}

interface ReturnValues {
  isStreaming: boolean;
  isLoadingIndicatorVisible: boolean;
  start: (url: string) => void;
  stop: () => void;
  reset: () => void;
  contentRef: RefObject<string>;
}

// SSEが極端に短時間で完了した場合でも、ローディング表示を視認できる最小表示時間
const MIN_LOADING_INDICATOR_MS = 300;

export function useSSE<T>(options: SSEOptions<T>): ReturnValues {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingIndicatorVisible, setIsLoadingIndicatorVisible] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const contentRef = useRef("");
  const streamStartedAtRef = useRef(0);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    const elapsed = Date.now() - streamStartedAtRef.current;
    const waitMs = Math.max(0, MIN_LOADING_INDICATOR_MS - elapsed);
    window.setTimeout(() => {
      setIsStreaming(false);
      setIsLoadingIndicatorVisible(false);
    }, waitMs);
  }, []);

  const reset = useCallback(() => {
    stop();
    contentRef.current = "";
  }, [stop]);

  const start = useCallback(
    (url: string) => {
      stop();
      contentRef.current = "";
      streamStartedAtRef.current = Date.now();
      setIsStreaming(true);
      setIsLoadingIndicatorVisible(true);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as T;

        const isDone = options.onDone?.(data) ?? false;
        if (isDone) {
          options.onComplete?.(contentRef.current);
          stop();
          return;
        }

        const newContent = options.onMessage(data, contentRef.current);
        contentRef.current = newContent;
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        stop();
      };
    },
    [options, stop],
  );

  return { contentRef, isLoadingIndicatorVisible, isStreaming, start, stop, reset };
}
