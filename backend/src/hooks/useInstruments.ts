import { useEffect, useState } from 'react';
import { instrumentsService } from '../services/instrumentsService';
import type { Instrument } from '../types';

export function useInstruments() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    instrumentsService
      .getAll()
      .then(setInstruments)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { instruments, loading, error };
}
