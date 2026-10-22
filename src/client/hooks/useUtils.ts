import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce hook for values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    ((...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Local storage hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Breakpoint hooks
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 599px)');
  const isTablet = useMediaQuery('(min-width: 600px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isWide = useMediaQuery('(min-width: 1280px)');

  return { isMobile, isTablet, isDesktop, isWide };
}

/**
 * Intersection observer hook
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) setEntry(entry);
    }, options);
    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return entry;
}

/**
 * Window size hook
 */
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Safe area insets hook
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
}

/**
 * Click outside hook
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/**
 * Keyboard shortcut hook
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (!options?.ctrl || event.ctrlKey) &&
        (!options?.shift || event.shiftKey) &&
        (!options?.alt || event.altKey) &&
        (!options?.meta || event.metaKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, callback, options]);
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Toggle hook
 */
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((v: boolean) => setValue(v), []);
  return [value, toggle, set];
}

/**
 * Copy to clipboard hook
 */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}

/**
 * Online status hook
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Idle detection hook
 */
export function useIdle(timeout: number = 30000): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), timeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(timer);
    };
  }, [timeout]);

  return isIdle;
}