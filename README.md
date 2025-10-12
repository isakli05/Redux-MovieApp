# 🎬 Redux Movie App

Modern React, TypeScript, Redux Toolkit ve TailwindCSS kullanılarak geliştirilmiş TMDB API v4 destekli film ve dizi uygulaması.

[🚀 Canlı Demo](https://isa-kaya-movieapp.netlify.app/)

![react redux ts movie App jpeg](movieapp.jpeg)

## ✨ Özellikler

- 🎭 **Film ve Dizi Kataloğu**: Popüler, yakında gelecek ve gösterimdeki içerikler
- 🔍 **Gelişmiş Arama**: Film, dizi ve kişi araması
- 👥 **Kişi Detayları**: Oyuncu ve yönetmen bilgileri
- 🎬 **Detaylı İçerik**: Fragmanlar, kadro, öneriler
- 📱 **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- ⚡ **Hızlı Performans**: RTK Query ile optimize edilmiş API çağrıları

## 🛠️ Teknoloji Stack'i

- **Frontend**: React 18 + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Styling**: TailwindCSS
- **Build Tool**: Vite
- **API**: TMDB API v4
- **Deployment**: Netlify

## 🚀 Kurulum

### Gereksinimler
- Node.js >= 18.0.0
- npm >= 9.0.0

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/your-username/Redux-MovieApp.git
cd Redux-MovieApp
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment variables'ları ayarlayın**
```bash
cp .env.example .env
```

4. **TMDB API v4 Access Token'ınızı alın**
   - [TMDB Developer Portal](https://developer.themoviedb.org/v4/docs/getting-started) adresine gidin
   - Yeni bir API key oluşturun
   - Access Token'ınızı `.env` dosyasına ekleyin:

```env
VITE_TMDB_ACCESS_TOKEN=your_access_token_here
VITE_TMDB_LANGUAGE=tr-TR
```

5. **Uygulamayı başlatın**
```bash
npm run dev
```

## 🔧 TMDB API v4 Geçişi

Bu proje TMDB API v4'ü kullanmaktadır. v3'ten v4'e geçiş için yapılan değişiklikler:

### Ana Değişiklikler
- **Authentication**: API Key → Bearer Token
- **Base URL**: `/3` → `/4`
- **Headers**: Authorization header kullanımı

### Geçiş Avantajları
- 🔐 **Gelişmiş Güvenlik**: Bearer token authentication
- ⚡ **Daha İyi Performans**: Optimize edilmiş API yanıtları
- 🆕 **Yeni Özellikler**: v4'e özel gelişmiş özellikler

## 📁 Proje Yapısı

```
src/
├── api/                    # API konfigürasyonu ve endpoint'ler
│   ├── endpoints/          # RTK Query endpoint'leri
│   └── tmdb.api.ts        # Ana API konfigürasyonu
├── components/             # React bileşenleri
├── Pages/                  # Sayfa bileşenleri
├── redux/                  # Redux store
├── types/                  # TypeScript tip tanımları
└── utils/                  # Yardımcı fonksiyonlar
```

## 🎯 Kullanılan API Endpoint'leri

- **Movies**: `/movie/popular`, `/movie/now_playing`, `/movie/upcoming`
- **TV Shows**: `/tv/popular`, `/tv/airing_today`, `/tv/on_the_air`
- **Search**: `/search/multi`, `/search/movie`, `/search/tv`
- **Persons**: `/person/popular`, `/person/{id}`

## 🚀 Deployment

Netlify üzerinde otomatik deployment yapılandırılmıştır:

1. Repository'yi Netlify'a bağlayın
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables'ları ekleyin

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- **GitHub**: [@your-username](https://github.com/your-username)
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/your-profile)
- **Email**: your.email@example.com
