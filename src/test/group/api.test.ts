/**
 * Üretim HTTP istemcisi (createHttpApi): uç nokta biçimleri ve hata eşleme.
 * (Kuralların kendisi core/memoryApi testlerinde; burada yalnız taşıma katmanı.)
 */

import { describe, expect, it, vi } from 'vitest';
import { createHttpApi, GroupApiError } from '../../lib/group/api';

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function apiWith(fetchMock: ReturnType<typeof vi.fn>) {
  return createHttpApi(fetchMock as unknown as typeof fetch);
}

describe('createHttpApi', () => {
  it('poll: GET /api/rooms?code=&pid= ve dönen view', async () => {
    const f = vi.fn().mockResolvedValue(
      jsonResponse(200, { code: 'AB23CD', phase: 'gathering' }),
    );
    const view = await apiWith(f).getRoom('AB23CD', 'p_x');
    expect(f).toHaveBeenCalledWith(
      '/api/rooms?code=AB23CD&pid=p_x',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(view.phase).toBe('gathering');
  });

  it('oy: POST /api/rooms/vote gövdesi {code,pid,vote:{key,value}}', async () => {
    const f = vi.fn().mockResolvedValue(jsonResponse(200, { phase: 'voting' }));
    await apiWith(f).vote('AB23CD', 'p_x', 'movie:7', 'strong');
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/rooms/vote');
    expect(JSON.parse(init.body as string)).toEqual({
      code: 'AB23CD', pid: 'p_x', vote: { key: 'movie:7', value: 'strong' },
    });
  });

  it('hata gövdesinden status+kod+mesaj çıkar', async () => {
    const f = vi.fn().mockResolvedValue(
      jsonResponse(429, { error: { code: 'rate_limited', message: 'Çok hızlı' } }),
    );
    await expect(apiWith(f).vote('AB23CD', 'p_x', 'movie:7', 'like')).rejects.toMatchObject({
      status: 429, code: 'rate_limited', message: 'Çok hızlı',
    });
  });

  it('ağ hatası → status 0 network; bozuk gövde → unknown kodu', async () => {
    const dead = vi.fn().mockRejectedValue(new TypeError('offline'));
    await expect(apiWith(dead).getRoom('AB23CD', 'p_x')).rejects.toMatchObject({
      status: 0, code: 'network',
    });
    const garbage = vi.fn().mockResolvedValue(new Response('<html>', { status: 502 }));
    await expect(apiWith(garbage).getRoom('AB23CD', 'p_x')).rejects.toBeInstanceOf(GroupApiError);
  });
});
