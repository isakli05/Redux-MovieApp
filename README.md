# 🎬 LMDB — Film ve Dizi Keşif Platformu

"Cinematic Atlas" tasarım diliyle yeniden tasarlanmış, TMDB verileriyle çalışan film ve dizi keşif uygulaması. React 18 + TypeScript + Redux Toolkit (RTK Query) + Tailwind CSS + Vite.

[🚀 Canlı Demo](https://isa-kaya-movieapp.netlify.app/)

## ✨ Özellikler

- 🎞️ **Sinematik ana sayfa**: Trend olanlar, vizyondakiler, eleştirmenlerin seçtikleri, gizli cevherler ve bölgenize göre ücretsiz izlenebilirler
- 📄 **Film/Dizi dosya sayfaları**: Fragmanlar, kadro, yayın platformları (bölgeye göre, JustWatch atıflı), öneriler, anahtar sözcükler
- 🔍 **Gelişmiş arama**: ⌘K komut paleti, TR+EN birleşik sonuçlar, gerçek sonuç sayıları, sayfalama
- 🧭 **Keşfet** (`/kesfet`): Tür, yıl, puan, dil ve sıralama filtreleri — URL'de saklanır, paylaşılabilir
- 👥 **Kişi sayfaları**: Biyografi, filmografi (film/dizi sekmeleri, sıralanabilir), dış bağlantılar
- 📺 **Sezon & bölüm deneyimi**: Filtreler, istatistikler, spoiler koruması, tembel yüklenen medya
- 📋 **Listeler & hesap**: TMDB hesabıyla giriş, liste oluştur/düzenle/sil, öğe ekle-çıkar
- ♿ **Erişilebilirlik**: WCAG 2.2 AA hedefi, klavye desteği, reduced-motion, Lighthouse Accessibility 100
- ⚡ **Performans**: Rota bazlı code-splitting (825→504 kB giriş paketi), srcset ile boyutlandırılmış görseller, CLS ~0.02

## 🛠️ Teknoloji

- **Frontend**: React 18, TypeScript, React Router 7 (lazy routes)
- **State**: Redux Toolkit + RTK Query
- **Stil**: Tailwind CSS (Cinematic Atlas token sistemi; Fraunces + Inter latin-ext)
- **Build**: Vite 6, Vitest + React Testing Library (259 test)
- **API**: **TMDB v3** — katalog okumaları istemciden doğrudan; kimlik doğrulama ve kullanıcı işlemleri (oturum, listeler, favoriler, izleme listesi, puanlar) Netlify Functions üzerindeki güvenli BFF proxy'sinden (`/api/*`, httpOnly çerez oturumu) geçer
- **Dağıtım**: Netlify (SPA + standart Functions)

## 🔐 Güvenlik modeli

- Kullanıcı oturumu (`session_id`) yalnızca sunucuda (Netlify Functions), httpOnly+Secure+SameSite=Lax çerezde tutulur; istemci JS'i oturum kimlik bilgisine erişemez.
- `TMDB_API_KEY` sunucu tarafı ortam değişkenidir, depoya commit edilmez. İstemci gömülü `VITE_TMDB_API_KEY` (v3 okuma anahtarı) TMDB'nin genel istemci tasarımına uygundur; sızmış önceki değerler döndürülmüştür.
- CSP, HSTS, Permissions-Policy başlıkları `netlify.toml` içinde tanımlıdır.

## 🚀 Kurulum

```bash
npm install
cp .env.example .env   # VITE_TMDB_API_KEY değerini kendi anahtarınızla doldurun
npm run dev
```

Kullanıcı akışlarını (giriş/listeler) yerelde denemek için: `.env` içine `TMDB_API_KEY` ekleyip `netlify dev` çalıştırın (Functions yalnızca Netlify CLI ile ayağa kalkar; düz `vite dev`'de arayüz girişsiz durumda sorunsuz çalışır).

### Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Vite geliştirme sunucusu |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest (259 test) |

## 📚 Dönüşüm belgeleri

Karar kayıtları ve kanıtlar: [`docs/transformation/`](docs/transformation/) — STATUS, DESIGN_DIRECTION, TMDB_CAPABILITIES, SECURITY_REMEDIATION, RELEASE_VERIFICATION, BASELINE.

---

Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalanmamıştır. Yayın bilgileri JustWatch tarafından sağlanır.
