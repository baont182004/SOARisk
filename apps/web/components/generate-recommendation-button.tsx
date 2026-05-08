'use client';

import type { Recommendation } from '@soc-soar/shared';
import Link from 'next/link';
import { useState } from 'react';

import { fetchApi } from '../lib/api';

type GenerateRecommendationButtonProps = {
  normalizedAlertId: string;
};

export function GenerateRecommendationButton({
  normalizedAlertId,
}: GenerateRecommendationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const handleGenerateRecommendation = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchApi<Recommendation>(
        `/recommendations/from-normalized/${normalizedAlertId}`,
        {
          method: 'POST',
        },
      );

      setMessage(response.message);
      setRecommendation(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tạo khuyến nghị.');
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        className="rounded-xl border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        onClick={handleGenerateRecommendation}
        type="button"
      >
        {loading ? 'Đang tạo...' : 'Tạo khuyến nghị'}
      </button>
      {recommendation ? (
        <Link
          className="block text-xs font-semibold text-teal-700 underline"
          href={`/recommendations/${recommendation.recommendationId}`}
        >
          Xem {recommendation.recommendationId}
        </Link>
      ) : null}
      {message ? <p className="max-w-xs text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
