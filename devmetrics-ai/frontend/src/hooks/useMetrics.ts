'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { OverviewData, TeamMember } from '@/types';

export function useOverview(days = 30) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/metrics/overview?days=${days}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError('Failed to load metrics');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, isLoading, error, refetch: fetchData };
}

export function useTeamMetrics(days = 30) {
  const [data, setData] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/metrics/team?days=${days}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [days]);

  return { data, isLoading };
}
