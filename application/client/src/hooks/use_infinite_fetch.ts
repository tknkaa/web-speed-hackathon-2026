import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

function getInitialTimelinePosts<T>(apiPath: string): T[] | null {
  if (apiPath !== "/api/v1/posts") {
    return null;
  }

  const initialPosts = window.__INITIAL_TIMELINE_POSTS__;
  if (!Array.isArray(initialPosts)) {
    return null;
  }

  const consumedPosts = initialPosts as unknown as T[];
  window.__INITIAL_TIMELINE_POSTS__ = undefined;
  return consumedPosts;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const initialDataRef = useRef<T[] | null>(getInitialTimelinePosts<T>(apiPath));
  const hasInitializedRef = useRef(false);
  const internalRef = useRef({
    hasMore: apiPath !== "" && (initialDataRef.current?.length ?? 0) >= LIMIT,
    isLoading: false,
    offset: initialDataRef.current?.length ?? 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialDataRef.current ?? [],
    error: null,
    isLoading: apiPath !== "" && initialDataRef.current === null,
  });

  const fetchMore = useCallback(() => {
    if (apiPath === "") {
      return;
    }

    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    const separator = apiPath.includes("?") ? "&" : "?";
    const pathWithPagination = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    void fetcher(pathWithPagination).then(
      (pagedData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pagedData],
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: pagedData.length >= LIMIT,
          isLoading: false,
          offset: offset + pagedData.length,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    const initialData = hasInitializedRef.current
      ? getInitialTimelinePosts<T>(apiPath)
      : initialDataRef.current;
    hasInitializedRef.current = true;
    setResult(() => ({
      data: initialData ?? [],
      error: null,
      isLoading: apiPath !== "" && initialData === null,
    }));
    internalRef.current = {
      hasMore: apiPath !== "" && ((initialData?.length ?? 0) >= LIMIT || initialData === null),
      isLoading: false,
      offset: initialData?.length ?? 0,
    };

    if (apiPath !== "" && initialData === null) {
      fetchMore();
    }
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
