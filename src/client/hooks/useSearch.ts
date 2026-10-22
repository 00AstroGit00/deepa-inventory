import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Search hook with URL synchronization
 */
export function useSearch(initialValue = '') {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localQuery, setLocalQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // Get search from URL or local state
  const searchQuery = searchParams.get('q') || localQuery;

  const setSearchQuery = useCallback((value: string) => {
    setLocalQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearSearch = useCallback(() => {
    setLocalQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const startSearch = useCallback(() => setIsSearching(true), []);
  const stopSearch = useCallback(() => setIsSearching(false), []);

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearching,
    startSearch,
    stopSearch,
  };
}

/**
 * Debounced search hook
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsDebouncing(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return {
    query,
    setQuery,
    debouncedQuery,
    isDebouncing,
  };
}

/**
 * Combined search with debounce and URL sync
 */
export function useUnifiedSearch(initialValue = '', delay = 300) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localQuery, setLocalQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Get initial value from URL
  const urlQuery = searchParams.get('q') || '';
  const effectiveQuery = urlQuery || localQuery;

  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(effectiveQuery);
      setIsDebouncing(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [effectiveQuery, delay]);

  const setSearchQuery = useCallback((value: string) => {
    setLocalQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearSearch = useCallback(() => {
    setLocalQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    query: effectiveQuery,
    debouncedQuery,
    setQuery: setSearchQuery,
    clearSearch,
    isDebouncing,
  };
}