import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'setiq.search.recent';
const MAX = 10;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setRecent(arr.filter((v) => typeof v === 'string').slice(0, MAX));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, []);

  const add = useCallback((term: string) => {
    const v = term.trim();
    if (!v) return;
    setRecent((prev) => {
      const next = [v, ...prev.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const remove = useCallback((term: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== term);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return { recent, add, remove, clear };
}
