/**
 * ListsDetail page wiring tests (defect J): add/remove item affordances are
 * wired to the BFF mutations through user.api.ts. No real network — global
 * fetch is mocked.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../redux/store';
import { setUser } from '../../redux/slices/authSlice';
import { resetAuthBootForTests } from '../../hooks/useAuth';
import { userApi } from '../../api/user.api';
import ListsDetail from '../ListsDetail';

const LIST_ID = 812;

const listPayload = {
  id: LIST_ID,
  name: 'Favorilerim',
  description: 'En sevdiğim filmler',
  created_by: 'isakli',
  favorite_count: 0,
  item_count: 2,
  iso_639_1: 'tr',
  public: true,
  page: 1,
  total_pages: 1,
  total_results: 2,
  items: [
    {
      id: 550,
      media_type: 'movie',
      title: 'Fight Club',
      poster_path: '/p.jpg',
      vote_average: 8.4,
      vote_count: 26000,
      release_date: '1999-10-15',
    },
    {
      id: 27205,
      media_type: 'movie',
      title: 'Inception',
      poster_path: null,
      vote_average: 8.4,
      release_date: '2010-07-16',
    },
  ],
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const fetchMock = vi.fn();

// fetchBaseQuery builds `new Request(relativeUrl)` — undici's Request (Node
// test env) requires absolute URLs, unlike browsers. Thin wrapper fixes it.
const NativeRequest = globalThis.Request;
class RelativeRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, 'http://localhost').toString()
        : input,
      init,
    );
  }
}

/** Normalize a mocked fetch call into {url (path+search), method, body}. */
async function callParts(call: unknown[]): Promise<{ url: string; method: string; body?: unknown }> {
  const input = call[0] as Request | string;
  const init = (call[1] ?? {}) as RequestInit;
  const req = typeof input === 'string' ? new RelativeRequest(input, init) : (input as Request);
  const url = new URL(req.url);
  let body: unknown;
  if (init.body !== undefined) {
    body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
  } else if (req.body) {
    body = await req.clone().json().catch(() => undefined);
  }
  return { url: url.pathname + url.search, method: req.method.toUpperCase(), body };
}

/** Route requests to stub endpoints; everything unexpected returns 500. */
function stubFetch() {
  fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
    const req =
      typeof input === 'string' ? new RelativeRequest(input, init) : (input as Request);
    const url = new URL(req.url);
    const path = url.pathname + url.search;
    const method = req.method.toUpperCase();

    if (path.startsWith('/api/auth/session')) {
      return jsonResponse({
        authenticated: true,
        account: { id: 42, username: 'isakli', name: 'İsa', avatar: null },
      });
    }
    if (path === `/api/lists/${LIST_ID}` || path.startsWith(`/api/lists/${LIST_ID}?`)) {
      return jsonResponse(listPayload);
    }
    if (path === `/api/lists/${LIST_ID}/items` && method === 'POST') {
      return jsonResponse({ success: true, status_code: 12 });
    }
    if (path === `/api/lists/${LIST_ID}/items` && method === 'DELETE') {
      return jsonResponse({ success: true, status_code: 13 });
    }
    return jsonResponse({ error: { code: 'unexpected', message: path } }, 500);
  });
}

function renderListDetail() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/lists/${LIST_ID}`]}>
        <Routes>
          <Route path="/lists/:id" element={<ListsDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  resetAuthBootForTests();
  fetchMock.mockReset();
  stubFetch();
  vi.stubGlobal('Request', RelativeRequest);
  vi.stubGlobal('fetch', fetchMock);
  store.dispatch(userApi.util.resetApiState());
  store.dispatch(
    setUser({ id: 42, username: 'isakli', name: 'İsa', avatar: null }),
  );
});

describe('ListsDetail (owner view)', () => {
  it('renders the list header and item grid with poster data', async () => {
    renderListDetail();

    expect(await screen.findByRole('heading', { name: 'Favorilerim' })).toBeInTheDocument();
    // The count line is split across elements ("2 film · Oluşturan: isakli").
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '2 film · Oluşturan: isakli',
      ),
    ).toBeInTheDocument();
    // Poster grid renders links for both movies.
    expect(screen.getByRole('link', { name: /Fight Club/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Inception/ })).toBeInTheDocument();
  });

  it('shows owner controls (edit/delete/add) when created_by matches the account', async () => {
    renderListDetail();
    await screen.findByRole('heading', { name: 'Favorilerim' });

    expect(screen.getByRole('button', { name: 'Düzenle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listeyi Sil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ekle$/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Fight Club filmini listeden çıkar')).toBeInTheDocument();
  });

  it('hides owner controls for non-owners (created_by mismatch)', async () => {
    // The boot-time /api/auth/session must agree with the local user, or the
    // boot effect overwrites it back to the owner.
    fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const req = typeof input === 'string' ? new RelativeRequest(input, init) : (input as Request);
      const path = new URL(req.url).pathname + new URL(req.url).search;
      if (path.startsWith('/api/auth/session')) {
        return jsonResponse({
          authenticated: true,
          account: { id: 77, username: 'someone-else', name: '', avatar: null },
        });
      }
      if (path.startsWith(`/api/lists/${LIST_ID}`)) return jsonResponse(listPayload);
      return jsonResponse({ error: { code: 'unexpected' } }, 500);
    });
    store.dispatch(setUser({ id: 77, username: 'someone-else', name: '', avatar: null }));

    renderListDetail();
    await screen.findByRole('heading', { name: 'Favorilerim' });

    expect(screen.queryByRole('button', { name: 'Düzenle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Listeyi Sil' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/listeden çıkar/)).not.toBeInTheDocument();
  });

  it('adds an item via POST /api/lists/:id/items when the owner submits a movie id (defect J)', async () => {
    const user = userEvent.setup();
    renderListDetail();
    const input = await screen.findByLabelText('TMDB film kimliği');

    await user.type(input, '13');
    await user.click(screen.getByRole('button', { name: /Ekle$/ }));

    await waitFor(async () => {
      const call = await Promise.all(
        fetchMock.mock.calls.map((c) => callParts(c as unknown[])),
      );
      const add = call.find(
        (p) => p.url === `/api/lists/${LIST_ID}/items` && p.method === 'POST',
      );
      expect(add).toBeDefined();
      expect(add?.body).toEqual({ mediaId: 13 });
    });
    expect(await screen.findByText('Film listeye eklendi.')).toBeInTheDocument();
  });

  it('removes an item via DELETE /api/lists/:id/items when the owner clicks remove (defect J)', async () => {
    const user = userEvent.setup();
    renderListDetail();
    await screen.findByRole('heading', { name: 'Favorilerim' });

    await user.click(screen.getByLabelText('Fight Club filmini listeden çıkar'));

    await waitFor(async () => {
      const call = await Promise.all(
        fetchMock.mock.calls.map((c) => callParts(c as unknown[])),
      );
      const remove = call.find(
        (p) => p.url === `/api/lists/${LIST_ID}/items` && p.method === 'DELETE',
      );
      expect(remove).toBeDefined();
      expect(remove?.body).toEqual({ mediaId: 550 });
    });
  });

  it('surfaces the duplicate-add case (TMDB status_code 8) in Turkish', async () => {
    fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const req = typeof input === 'string' ? new RelativeRequest(input, init) : (input as Request);
      const url = new URL(req.url);
      const path = url.pathname + url.search;
      const method = req.method.toUpperCase();
      if (path.startsWith('/api/auth/session')) {
        return jsonResponse({
          authenticated: true,
          account: { id: 42, username: 'isakli', name: 'İsa', avatar: null },
        });
      }
      if (path === `/api/lists/${LIST_ID}/items` && method === 'POST') {
        // RTK Query treats non-2xx as error; BFF maps duplicates to this shape.
        return jsonResponse({ error: { code: 'upstream_unavailable', status_code: 8 } }, 502);
      }
      if (path.startsWith(`/api/lists/${LIST_ID}`)) return jsonResponse(listPayload);
      return jsonResponse({ error: { code: 'unexpected' } }, 500);
    });

    const user = userEvent.setup();
    renderListDetail();
    const input = await screen.findByLabelText('TMDB film kimliği');
    await user.type(input, '550');
    await user.click(screen.getByRole('button', { name: /Ekle$/ }));

    expect(await screen.findByText('Bu film listede zaten var.')).toBeInTheDocument();
  });

  it('shows the error state when the list cannot be loaded', async () => {
    fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const req = typeof input === 'string' ? new RelativeRequest(input, init) : (input as Request);
      const path = new URL(req.url).pathname + new URL(req.url).search;
      if (path.startsWith('/api/auth/session')) {
        return jsonResponse({ authenticated: false });
      }
      return jsonResponse({ error: { code: 'not_found' } }, 404);
    });
    store.dispatch(setUser(null));

    renderListDetail();
    expect(await screen.findByText('Liste yüklenemedi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tekrar Dene' })).toBeInTheDocument();
  });

  it('renders within a document title carrying the list name (useSEO)', async () => {
    renderListDetail();
    await screen.findByRole('heading', { name: 'Favorilerim' });
    await waitFor(() => expect(document.title).toBe('Favorilerim · LMDB'));
  });
});
