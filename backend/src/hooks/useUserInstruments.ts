import { useCallback, useEffect, useState } from 'react';
import { userInstrumentsService } from '../services/userInstrumentsService';
import type { UserInstrument } from '../types';

export function useUserInstruments(userId: string | null) {
  const [userInstruments, setUserInstruments] = useState<UserInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await userInstrumentsService.getForUser(userId);
      setUserInstruments(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (instrumentId: string) => {
    if (!userId) return;
    const item = await userInstrumentsService.add(userId, instrumentId);
    setUserInstruments((prev) => [...prev, item]);
  }, [userId]);

  const remove = useCallback(async (instrumentId: string) => {
    if (!userId) return;
    await userInstrumentsService.remove(userId, instrumentId);
    setUserInstruments((prev) => prev.filter((i) => i.instrument_id !== instrumentId));
  }, [userId]);

  return { userInstruments, loading, error, add, remove, refresh: load };
}
