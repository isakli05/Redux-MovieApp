# Requirements Document

## Introduction

Bu özellik, TV dizilerinin sezon listesi sayfasını (/tv/{id}/seasons) modern, kapsamlı ve görsel olarak çekici bir tasarımla yeniden tasarlamayı amaçlamaktadır. Mevcut sayfa temel sezon bilgilerini göstermektedir ancak kullanıcı deneyimini iyileştirecek birçok eksik özellik bulunmaktadır. Yeni tasarım, TMDB API'den ek veriler çekerek (sezon fragmanları, cast bilgileri, istatistikler) zengin bir içerik sunacak, modern UI/UX prensipleriyle kullanıcı etkileşimini artıracak ve projedeki diğer sayfalarla (Movies.tsx gibi) tutarlı bir görsel dil oluşturacaktır.

## Requirements

### Requirement 1: Zenginleştirilmiş Sezon Kartları

**User Story:** Bir kullanıcı olarak, her sezon için sadece temel bilgileri değil, ayrıca görsel istatistikler, oyuncu bilgileri ve fragman erişimi gibi zengin içerikleri görmek istiyorum, böylece hangi sezonu izleyeceğime daha bilinçli karar verebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı sezon listesi sayfasını görüntülediğinde THEN her sezon kartı şu bilgileri içermelidir:
   - Sezon posteri (mevcut)
   - Sezon adı ve numarası (mevcut)
   - Yayın tarihi ve yıl (mevcut)
   - Bölüm sayısı (mevcut)
   - Sezon açıklaması (mevcut)
   - Ortalama puan (vote_average) - yıldız ikonu ile
   - Oy sayısı (vote_count)
   - İlk ve son bölüm yayın tarihleri
   - Sezon durumu (tamamlandı/devam ediyor)

2. WHEN sezon kartı üzerine gelindiğinde (hover) THEN kart şu görsel efektleri göstermelidir:
   - Yumuşak scale animasyonu (1.02x büyüme)
   - Gölge efekti artışı
   - Gradient overlay ile bilgi vurgusu
   - "Detayları Gör" butonu fade-in animasyonu

3. WHEN sezon için fragman mevcutsa THEN kart üzerinde "Fragman İzle" butonu görünmelidir

4. WHEN kullanıcı "Fragman İzle" butonuna tıkladığında THEN modal/overlay içinde fragman oynatılmalıdır

### Requirement 2: Sezon İstatistikleri ve Görselleştirme

**User Story:** Bir kullanıcı olarak, sezonlar hakkında görsel istatistikler ve karşılaştırmalı bilgiler görmek istiyorum, böylece dizinin genel kalitesi ve popülaritesi hakkında hızlı bir fikir edinebilirim.

#### Acceptance Criteria

1. WHEN sayfa yüklendiğinde THEN sayfa üst kısmında genel istatistikler bölümü görünmelidir:
   - Toplam sezon sayısı
   - Toplam bölüm sayısı
   - Ortalama sezon puanı
   - En yüksek puanlı sezon
   - En çok bölümlü sezon

2. WHEN istatistikler görüntülendiğinde THEN her istatistik modern bir kart içinde icon ve animasyonlu sayılarla sunulmalıdır

3. WHEN kullanıcı sezon listesini görüntülediğinde THEN her sezon kartında progress bar ile sezon tamamlanma durumu gösterilmelidir

4. IF sezon devam ediyorsa THEN "Devam Ediyor" badge'i gösterilmelidir

5. IF sezon tamamlanmışsa THEN "Tamamlandı" badge'i gösterilmelidir

### Requirement 3: Sezon Cast Önizlemesi

**User Story:** Bir kullanıcı olarak, her sezonun başrol oyuncularını görmek istiyorum, böylece favori oyuncularımın hangi sezonlarda yer aldığını hızlıca öğrenebilirim.

#### Acceptance Criteria

1. WHEN sezon kartı görüntülendiğinde THEN sezonun ilk 4-5 başrol oyuncusunun profil fotoğrafları yatay bir liste halinde gösterilmelidir

2. WHEN oyuncu fotoğrafları üzerine gelindiğinde THEN oyuncu adı tooltip olarak görünmelidir

3. WHEN 5'ten fazla oyuncu varsa THEN "+X daha fazla" göstergesi eklenmelidir

4. WHEN kullanıcı oyuncu fotoğrafına tıkladığında THEN oyuncunun detay sayfasına yönlendirilmelidir

5. IF sezon için cast bilgisi yoksa THEN bu bölüm gizlenmelidir

### Requirement 4: Gelişmiş Filtreleme ve Sıralama

**User Story:** Bir kullanıcı olarak, sezonları farklı kriterlere göre filtreleyip sıralayabilmek istiyorum, böylece aradığım sezonu daha hızlı bulabilirim.

#### Acceptance Criteria

1. WHEN sayfa yüklendiğinde THEN filtreleme ve sıralama kontrolleri görünmelidir

2. WHEN kullanıcı sıralama seçeneğini değiştirdiğinde THEN sezonlar şu kriterlere göre sıralanabilmelidir:
   - Sezon numarasına göre (artan/azalan)
   - Puana göre (yüksekten düşüğe/düşükten yükseğe)
   - Yayın tarihine göre (yeni/eski)
   - Bölüm sayısına göre (çok/az)

3. WHEN kullanıcı filtreleme uygularsa THEN sezonlar şu kriterlere göre filtrelenebilmelidir:
   - Minimum puan eşiği (slider ile)
   - Yayın yılı aralığı
   - Durum (tamamlandı/devam ediyor)

4. WHEN filtreleme veya sıralama değiştiğinde THEN liste smooth animasyonla güncellenmelidir

5. WHEN aktif filtre varsa THEN "Filtreleri Temizle" butonu görünmelidir

### Requirement 5: Responsive ve Modern UI Tasarımı

**User Story:** Bir kullanıcı olarak, sayfanın tüm cihazlarda mükemmel görünmesini ve projenin genel tasarım diliyle uyumlu olmasını istiyorum, böylece tutarlı bir deneyim yaşayabilirim.

#### Acceptance Criteria

1. WHEN sayfa herhangi bir cihazda görüntülendiğinde THEN responsive grid layout kullanılmalıdır:
   - Mobile: 1 kolon
   - Tablet: 2 kolon
   - Desktop: 2-3 kolon (sezon kartı boyutuna göre)

2. WHEN sayfa yüklendiğinde THEN Movies.tsx sayfasıyla tutarlı tasarım elementleri kullanılmalıdır:
   - Gradient arka planlar
   - Glassmorphism efektleri
   - Heroicons icon seti
   - Cyan/Blue renk paleti
   - Tailwind CSS utility classes

3. WHEN kullanıcı sayfada scroll yaparsa THEN smooth scroll animasyonları ve lazy loading uygulanmalıdır

4. WHEN sayfa yüklenirken THEN skeleton loader gösterilmelidir

5. WHEN hata oluşursa THEN kullanıcı dostu hata mesajı ve retry butonu gösterilmelidir

### Requirement 6: Sezon Fragmanları ve Video İçeriği

**User Story:** Bir kullanıcı olarak, sezon fragmanlarını ve teaser'larını doğrudan sezon listesi sayfasından izleyebilmek istiyorum, böylece detay sayfasına gitmeden içerik hakkında fikir edinebilirim.

#### Acceptance Criteria

1. WHEN sayfa yüklendiğinde THEN her sezon için TMDB API'den video bilgileri çekilmelidir

2. WHEN sezon için fragman mevcutsa THEN sezon kartında "Fragman İzle" butonu görünmelidir

3. WHEN kullanıcı "Fragman İzle" butonuna tıkladığında THEN modal içinde YouTube video player açılmalıdır

4. WHEN modal açıksa THEN kullanıcı ESC tuşu veya overlay tıklamasıyla modalı kapatabilmelidir

5. WHEN modal kapatıldığında THEN video otomatik olarak durdurulmalıdır

6. IF sezon için birden fazla video varsa THEN kullanıcı modal içinde video listesinden seçim yapabilmelidir

### Requirement 7: Performans ve Optimizasyon

**User Story:** Bir kullanıcı olarak, sayfanın hızlı yüklenmesini ve akıcı çalışmasını istiyorum, böylece kesintisiz bir deneyim yaşayabilirim.

#### Acceptance Criteria

1. WHEN sayfa yüklendiğinde THEN tüm API çağrıları paralel olarak yapılmalıdır

2. WHEN görsel içerikler yüklenirken THEN lazy loading ve progressive image loading kullanılmalıdır

3. WHEN kullanıcı sayfada gezinirken THEN RTK Query cache mekanizması kullanılarak gereksiz API çağrıları önlenmelidir

4. WHEN sezon kartları render edilirken THEN React.memo ve useMemo ile gereksiz re-render'lar önlenmelidir

5. WHEN sayfa ilk yüklendiğinde THEN critical CSS inline olarak yüklenmelidir

### Requirement 8: Erişilebilirlik (Accessibility)

**User Story:** Bir kullanıcı olarak, sayfanın erişilebilirlik standartlarına uygun olmasını istiyorum, böylece tüm kullanıcılar içeriğe eşit şekilde erişebilsin.

#### Acceptance Criteria

1. WHEN sayfa render edildiğinde THEN tüm interaktif elementler keyboard ile erişilebilir olmalıdır

2. WHEN kullanıcı tab tuşu ile gezindiğinde THEN focus indicator'lar açıkça görünmelidir

3. WHEN görseller yüklendiğinde THEN tüm img elementleri anlamlı alt text içermelidir

4. WHEN butonlar ve linkler kullanıldığında THEN aria-label ve role attribute'ları eklenmelidir

5. WHEN renk kontrastı kullanıldığında THEN WCAG AA standartlarına uygun olmalıdır

### Requirement 9: Yeni API Endpoint Entegrasyonu

**User Story:** Bir geliştirici olarak, TMDB API'den ek endpoint'ler entegre ederek sayfa içeriğini zenginleştirmek istiyorum, böylece kullanıcılara daha fazla bilgi sunabilirim.

#### Acceptance Criteria

1. WHEN sezon listesi yüklendiğinde THEN her sezon için `/tv/{tv_id}/season/{season_number}/videos` endpoint'i çağrılmalıdır

2. WHEN sezon detayları gerektiğinde THEN `/tv/{tv_id}/season/{season_number}/aggregate_credits` endpoint'i kullanılarak cast bilgileri alınmalıdır

3. WHEN API çağrıları yapılırken THEN RTK Query ile endpoint'ler tv.endpoints.ts dosyasına eklenmelidir

4. WHEN yeni endpoint'ler eklendiğinde THEN TypeScript type definitions oluşturulmalıdır

5. WHEN API hataları oluştuğunda THEN graceful error handling uygulanmalıdır

### Requirement 10: Animasyonlar ve Mikro-etkileşimler

**User Story:** Bir kullanıcı olarak, sayfada smooth animasyonlar ve mikro-etkileşimler görmek istiyorum, böylece premium bir deneyim yaşayabilirim.

#### Acceptance Criteria

1. WHEN sayfa ilk yüklendiğinde THEN sezon kartları staggered fade-in animasyonu ile görünmelidir

2. WHEN kullanıcı bir karta hover yaptığında THEN smooth transform ve shadow animasyonları çalışmalıdır

3. WHEN filtreleme veya sıralama değiştiğinde THEN kartlar fade-out/fade-in animasyonu ile güncellenmelidir

4. WHEN modal açılıp kapandığında THEN scale ve opacity animasyonları kullanılmalıdır

5. WHEN loading state'de THEN skeleton loader shimmer animasyonu gösterilmelidir

6. WHEN scroll yapıldığında THEN "Başa Dön" butonu fade-in animasyonu ile görünmelidir
