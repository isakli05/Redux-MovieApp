/**
 * Oda yaşam döngüsü, eşzamanlılık, yetki/hız limiti ve enumeration
 * negatifleri — bellek adaptörü üzerinden (sunucu fonksiyonlarıyla aynı
 * core.ts kuralları). İki api örneği = iki ayrı istemci.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryApi, createMemoryStore, type MemoryStore } from '../../lib/group/memoryApi';
import { GroupApiError, type GroupApi } from '../../lib/group/api';

let store: MemoryStore;
let host: GroupApi;
let guest: GroupApi;

beforeEach(() => {
  store = createMemoryStore();
  host = createMemoryApi(store);
  guest = createMemoryApi(store);
});

const CONSTRAINTS = { mediaType: 'movie', maxRuntime: 120, genres: [35], region: 'TR', providers: [] };

async function newRoom() {
  return host.createRoom({ name: 'Ev Sahibi', constraints: CONSTRAINTS });
}

/** Toplama fazında bir misafir katılmış, adaylar üretilmiş, oylama açık oda. */
async function votingRoom() {
  const r = await newRoom();
  const g = await guest.joinRoom(r.code, 'Deniz');
  await host.generateCandidates(r.code, r.hostKey, r.pid);
  await host.setPhase(r.code, r.hostKey, r.pid, 'voting');
  return { r, g };
}

describe('yaşam döngüsü', () => {
  it('kur → katıl → aday → oyla → reveal; misafir aynı sonucu görür', async () => {
    const { r, g } = await votingRoom();
    const hostView = await host.getRoom(r.code, r.pid);
    const keys = hostView.candidates.map((c) => c.key);
    expect(keys.length).toBeGreaterThanOrEqual(2);

    await host.vote(r.code, r.pid, keys[0], 'like');
    await guest.vote(r.code, g.pid, keys[0], 'strong');
    expect(Object.keys(hostView.me.myVotes)).toHaveLength(0); // oy öncesi view'da yok

    const revealed = await host.setPhase(r.code, r.hostKey, r.pid, 'reveal');
    expect(revealed.phase).toBe('reveal');
    expect(revealed.result?.winner?.key).toBe(keys[0]);

    // Kasıtlı faz geçişi her istemcide aynı anda poll'a yansır
    const guestView = await guest.getRoom(r.code, g.pid);
    expect(guestView.phase).toBe('reveal');
    expect(guestView.result?.winner?.key).toBe(keys[0]);
  });

  it('geç katılım yalnız toplama fazında; oylama başlayınca kapalı', async () => {
    const r = await newRoom();
    await host.generateCandidates(r.code, r.hostKey, r.pid);
    await host.setPhase(r.code, r.hostKey, r.pid, 'voting');
    await expect(guest.joinRoom(r.code, 'Geç Kalmış')).rejects.toMatchObject({
      status: 409, code: 'join_closed',
    });
  });

  it('DNA özeti oyları ağırlaştırır: güçlü oy iki kat sayılır', async () => {
    const { r, g } = await votingRoom();
    const key = (await host.getRoom(r.code, r.pid)).candidates[0].key;
    // fakeDiscover genreIds=[35] üretir → misafir 35 türünü seviyor
    await guest.attachTaste(r.code, g.pid, [35]);
    await host.vote(r.code, r.pid, key, 'like'); // 1 puan
    await guest.vote(r.code, g.pid, key, 'strong'); // 3×2 = 6 puan
    const revealed = await host.setPhase(r.code, r.hostKey, r.pid, 'reveal');
    expect(revealed.result?.winner?.score).toBe(7);
    expect(revealed.result?.winner?.boosted).toBe(true);
  });

  it('TTL: 24 saat sonra oda erişilemez VE anahtarlar temizlenir', async () => {
    let now = 1_700_000_000_000;
    const clockStore = createMemoryStore(() => now);
    const a = createMemoryApi(clockStore);
    const r = await a.createRoom({ name: 'X' });
    await a.joinRoom(r.code, 'Y');

    now += 24 * 60 * 60 * 1000 + 1;
    await expect(a.getRoom(r.code, r.pid)).rejects.toMatchObject({ code: 'room_not_found' });
    await expect(a.joinRoom(r.code, 'Z')).rejects.toMatchObject({ code: 'room_not_found' });
    expect(clockStore.docs.size).toBe(0);
    expect(clockStore.participants.size).toBe(0);
  });
});

describe('eşzamanlılık', () => {
  it('üç istemci aynı anda oy verir — biri diğerini ezmez', async () => {
    const guest2 = createMemoryApi(store); // üçüncü istemci
    const r = await newRoom();
    const g1 = await guest.joinRoom(r.code, 'Deniz');
    const g2 = await guest2.joinRoom(r.code, 'Ayla');
    await host.generateCandidates(r.code, r.hostKey, r.pid);
    await host.setPhase(r.code, r.hostKey, r.pid, 'voting');
    const keys = (await host.getRoom(r.code, r.pid)).candidates.map((c) => c.key);

    await Promise.all([
      host.vote(r.code, r.pid, keys[0], 'strong'),
      guest.vote(r.code, g1.pid, keys[1], 'strong'),
      guest2.vote(r.code, g2.pid, keys[2], 'dislike'),
    ]);

    const view = await host.getRoom(r.code, r.pid);
    expect(view.participants.map((p) => p.votedCount).sort()).toEqual([1, 1, 1]);
    const revealed = await host.setPhase(r.code, r.hostKey, r.pid, 'reveal');
    expect(revealed.result?.ranking).toHaveLength(keys.length - 1); // vetolu aday elendi
    expect(revealed.result?.winner?.strong).toBe(1);
  });

  it('eşzamanlı katılımlar: kimse kaybolmaz', async () => {
    const r = await newRoom();
    await Promise.all([
      guest.joinRoom(r.code, 'A'),
      guest.joinRoom(r.code, 'B'),
      guest.joinRoom(r.code, 'C'),
    ]);
    const view = await host.getRoom(r.code, r.pid);
    expect(view.participants).toHaveLength(4);
  });
});

describe('yetki ve doğrulama', () => {
  it('hostKey olmadan/yanlışsa yönetim → 403', async () => {
    const r = await newRoom();
    await expect(
      host.setConstraints(r.code, 'h_bogus', r.pid, r.view.constraints),
    ).rejects.toMatchObject({ status: 403, code: 'not_host' });
    await expect(
      guest.setConstraints(r.code, 'herhangi', r.pid, r.view.constraints),
    ).rejects.toMatchObject({ status: 403, code: 'not_host' });
  });

  it('aday yokken oylama başlamaz; faz atlanamaz', async () => {
    const r = await newRoom();
    await expect(host.setPhase(r.code, r.hostKey, r.pid, 'voting'))
      .rejects.toMatchObject({ code: 'no_candidates' });
    await host.generateCandidates(r.code, r.hostKey, r.pid);
    await expect(host.setPhase(r.code, r.hostKey, r.pid, 'reveal'))
      .rejects.toMatchObject({ code: 'phase' });
  });

  it('geçersiz oy ve geçersiz kısıt reddedilir', async () => {
    const { r } = await votingRoom();
    await expect(host.vote(r.code, r.pid, 'movie:999999', 'like'))
      .rejects.toMatchObject({ code: 'invalid_vote' });
    // Kısıt doğrulaması toplama fazında (yeni bir oda):
    const fresh = await newRoom();
    await expect(
      host.setConstraints(fresh.code, fresh.hostKey, fresh.pid, {
        mediaType: 'movie', maxRuntime: 5, genres: [], region: 'TR', providers: [],
      }),
    ).rejects.toMatchObject({ code: 'invalid_constraints' });
  });

  it('katılımcı başına hız limiti: arksız seri oylar 429 alır', async () => {
    const { r } = await votingRoom();
    const keys = (await host.getRoom(r.code, r.pid)).candidates.map((c) => c.key);
    const results: string[] = [];
    for (const k of [...keys, ...keys]) {
      try {
        await host.vote(r.code, r.pid, k, 'like');
        results.push('ok');
      } catch (e) {
        expect(e).toBeInstanceOf(GroupApiError);
        expect((e as GroupApiError).code).toBe('rate_limited');
        results.push('limited');
        break;
      }
    }
    expect(results).toContain('limited');
    expect(results[0]).toBe('ok');
  });

  it('oy değiştirme: pencere geçince son oy geçerli olur', async () => {
    const { r } = await votingRoom();
    const key = (await host.getRoom(r.code, r.pid)).candidates[0].key;
    await host.vote(r.code, r.pid, key, 'like');
    await new Promise((res) => setTimeout(res, 260)); // RATE_MIN_INTERVAL_MS üstü
    const v = await host.vote(r.code, r.pid, key, 'dislike');
    expect(v.me.myVotes[key]).toBe('dislike');
  });
});

describe('enumeration ve gizlilik negatifleri', () => {
  it('var olmayan kod: sanitize edilmiş tek tip 404', async () => {
    const grab = async (p: Promise<unknown>): Promise<GroupApiError> => {
      try {
        await p;
        throw new Error('beklenmedik başarı');
      } catch (e) {
        return e as GroupApiError;
      }
    };
    const [joinErr, pollErr] = await Promise.all([
      grab(host.joinRoom('AAAAAA', 'X')),
      grab(host.getRoom('ZZZZZZ', 'p_none')),
    ]);
    expect(joinErr.code).toBe('room_not_found');
    expect(joinErr.status).toBe(404);
    expect(pollErr.code).toBe('room_not_found');
    expect(pollErr.message).toBe(joinErr.message); // varlık bilgisi sızmıyor
  });

  it('geçersiz formatlı kod arama yapılmadan reddedilir', async () => {
    await expect(host.getRoom('abc', 'p_x')).rejects.toMatchObject({ code: 'room_not_found' });
    await expect(host.getRoom('../etc', 'p_x')).rejects.toMatchObject({ code: 'room_not_found' });
  });

  it('geçerli odada bilinmeyen pid → not_in_room; view asla hostKey taşımaz', async () => {
    const r = await newRoom();
    await expect(host.getRoom(r.code, 'p_spy')).rejects.toMatchObject({ code: 'not_in_room' });
    const view = await host.getRoom(r.code, r.pid);
    expect(JSON.stringify(view)).not.toContain(r.hostKey);
    expect(view.me.myVotes).toEqual({});
  });

  it('oylama fazında başkalarının oyları görünmez; reveal aşamasında yalnız sayaçlar', async () => {
    const { r, g } = await votingRoom();
    const key = (await host.getRoom(r.code, r.pid)).candidates[0].key;
    await host.vote(r.code, r.pid, key, 'strong');
    const guestView = await guest.getRoom(r.code, g.pid);
    expect(JSON.stringify(guestView)).not.toContain('"strong"');
    expect(guestView.me.myVotes).toEqual({});
    await host.setPhase(r.code, r.hostKey, r.pid, 'reveal');
    const revealed = await guest.getRoom(r.code, g.pid);
    expect(revealed.result?.winner?.strong).toBe(1); // sayaç var, kimin oyu yok
  });
});
