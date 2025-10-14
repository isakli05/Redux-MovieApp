# Requirements Document

## Introduction

Bu özellik, TMDB API'den gelen tüm medya içeriklerini (videolar, posterler, backdrop'lar, logolar, profil fotoğrafları) kapsamlı bir şekilde entegre ederek uygulamayı görsel açıdan zenginleştirecektir. Mevcut durumda sadece fragman videoları gösterilmektedir. Bu geliştirme ile film, dizi, sezon ve kişi detay sayfalarına profesyonel medya galerileri eklenecek ve kullanıcı deneyimi önemli ölçüde iyileştirilecektir.

## Requirements

### Requirement 1: Film Detay Sayfası Medya Galerisi

**User Story:** Film severler olarak, bir filmin detay sayfasında sadece fragmanları değil, tüm görselleri (posterler, backdrop'lar, logolar) ve videoları (fragmanlar, kamera arkası, klipler) galeri formatında görmek istiyorum, böylece film hakkında daha zengin görsel içeriğe erişebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı bir film detay sayfasını ziyaret ettiğinde THEN sistem film ile ilişkili tüm medya içeriklerini (images ve videos) TMDB API'den çekmelidir
2. WHEN medya içerikleri yüklendiğinde THEN sistem bunları kategorize edilmiş sekmeler (Videolar, Posterler, Backdrop'lar, Logolar) halinde göstermelidir
3. WHEN kullanıcı bir görsele tıkladığında THEN sistem görseli lightbox/modal içinde tam ekran görüntüleme seçeneği ile göstermelidir
4. WHEN kullanıcı bir videoya tıkladığında THEN sistem videoyu modal içinde YouTube embed ile oynatmalıdır
5. IF bir kategoride içerik yoksa THEN o sekme gizlenmeli veya devre dışı bırakılmalıdır
6. WHEN galeri yüklenirken THEN sistem skeleton loader göstermelidir
7. WHEN görseller yüklendiğinde THEN sistem lazy loading kullanarak performansı optimize etmelidir
8. WHEN kullanıcı lightbox'ta gezinirken THEN klavye kısayolları (ok tuşları, ESC) desteklenmelidir

### Requirement 2: Dizi Detay Sayfası Medya Galerisi

**User Story:** Dizi takipçileri olarak, bir dizinin detay sayfasında tüm görselleri ve videoları galeri formatında görmek istiyorum, böylece dizi hakkında kapsamlı görsel içeriğe erişebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı bir dizi detay sayfasını ziyaret ettiğinde THEN sistem dizi ile ilişkili tüm medya içeriklerini TMDB API'den çekmelidir
2. WHEN medya içerikleri yüklendiğinde THEN sistem bunları kategorize edilmiş sekmeler halinde göstermelidir
3. WHEN kullanıcı medya galerisinde gezinirken THEN film detay sayfası ile aynı kullanıcı deneyimini yaşamalıdır
4. WHEN görseller görüntülendiğinde THEN her görselin boyutu, dili ve oy sayısı gibi meta bilgileri gösterilmelidir
5. IF dizi için özel logolar varsa THEN bunlar ayrı bir sekmede gösterilmelidir

### Requirement 3: Sezon Detay Sayfası Medya Galerisi

**User Story:** Dizi izleyicileri olarak, bir sezonun detay sayfasında o sezona özel görselleri ve videoları görmek istiyorum, böylece sezon hakkında daha detaylı görsel bilgiye erişebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı bir sezon detay sayfasını ziyaret ettiğinde THEN sistem sezona özel medya içeriklerini TMDB API'den çekmelidir
2. WHEN sezon videoları yüklendiğinde THEN bunlar mevcut sezon detay sayfasına entegre edilmelidir
3. WHEN sezon posterleri yüklendiğinde THEN bunlar galeri formatında gösterilmelidir
4. IF sezon için özel videolar (fragman, kamera arkası) varsa THEN bunlar öncelikli olarak gösterilmelidir
5. WHEN kullanıcı sezon galerisinde gezinirken THEN bölüm bazlı görseller varsa bunlar da dahil edilmelidir

### Requirement 4: Sezon Listesi Sayfası Görsel Zenginleştirme

**User Story:** Dizi takipçileri olarak, sezonlar listesi sayfasında her sezonun posterini ve önizleme görsellerini görmek istiyorum, böylece sezonlar arasında görsel olarak ayrım yapabilir ve ilgimi çeken sezonu seçebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı sezonlar listesi sayfasını ziyaret ettiğinde THEN her sezon kartında sezona özel poster gösterilmelidir
2. WHEN kullanıcı bir sezon kartının üzerine geldiğinde (hover) THEN ek görsel önizlemeler veya mini galeri gösterilmelidir
3. IF bir sezon için fragman varsa THEN sezon kartında "Fragman İzle" butonu gösterilmelidir
4. WHEN kullanıcı "Fragman İzle" butonuna tıkladığında THEN fragman modal içinde oynatılmalıdır

### Requirement 5: Kişi Detay Sayfası Profil Galerisi

**User Story:** Film ve dizi severler olarak, bir oyuncunun veya yönetmenin detay sayfasında profil fotoğraflarını galeri formatında görmek istiyorum, böylece kişi hakkında daha fazla görsel içeriğe erişebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı bir kişi detay sayfasını ziyaret ettiğinde THEN sistem kişiye ait tüm profil fotoğraflarını TMDB API'den çekmelidir
2. WHEN profil fotoğrafları yüklendiğinde THEN bunlar grid layout ile galeri formatında gösterilmelidir
3. WHEN kullanıcı bir profil fotoğrafına tıkladığında THEN fotoğraf lightbox içinde tam boyutta gösterilmelidir
4. WHEN profil galerisi görüntülendiğinde THEN en yüksek çözünürlüklü görseller kullanılmalıdır

### Requirement 6: API Endpoint'leri ve Veri Yönetimi

**User Story:** Geliştirici olarak, TMDB API'den medya içeriklerini verimli bir şekilde çekmek ve yönetmek için yeni endpoint'ler ve type tanımlamaları oluşturmak istiyorum, böylece kod tabanı temiz, tip güvenli ve bakımı kolay olur.

#### Acceptance Criteria

1. WHEN yeni medya endpoint'leri oluşturulduğunda THEN bunlar RTK Query ile implement edilmelidir
2. WHEN API çağrıları yapıldığında THEN uygun cache stratejileri kullanılmalıdır
3. WHEN medya verileri alındığında THEN TypeScript type'ları tam ve doğru olmalıdır
4. WHEN endpoint'ler oluşturulduğında THEN aşağıdaki TMDB API endpoint'leri kullanılmalıdır:
   - `/movie/{movie_id}/images` - Film görselleri
   - `/tv/{tv_id}/images` - Dizi görselleri
   - `/tv/{tv_id}/season/{season_number}/images` - Sezon görselleri
   - `/person/{person_id}/images` - Kişi profil fotoğrafları
5. WHEN API yanıtları işlendiğinde THEN hata durumları gracefully handle edilmelidir
6. WHEN medya verileri cache'lendiğinde THEN uygun invalidation stratejileri uygulanmalıdır

### Requirement 7: Medya Galeri Bileşeni (Reusable Component)

**User Story:** Geliştirici olarak, farklı sayfalarda kullanılabilecek yeniden kullanılabilir bir medya galeri bileşeni oluşturmak istiyorum, böylece kod tekrarını önler ve tutarlı bir kullanıcı deneyimi sağlarım.

#### Acceptance Criteria

1. WHEN medya galeri bileşeni oluşturulduğunda THEN bileşen farklı medya tipleri (video, image) için generic olmalıdır
2. WHEN bileşen kullanıldığında THEN props ile özelleştirilebilir olmalıdır (layout, görüntüleme modu, filtreleme)
3. WHEN galeri render edildiğinde THEN responsive tasarım prensipleri uygulanmalıdır
4. WHEN bileşen mount edildiğinde THEN accessibility standartlarına (ARIA labels, keyboard navigation) uygun olmalıdır
5. WHEN galeri içinde gezinildiğinde THEN smooth animasyonlar ve transition'lar kullanılmalıdır
6. WHEN bileşen unmount edildiğinde THEN memory leak'ler önlenmelidir

### Requirement 8: Lightbox/Modal Bileşeni

**User Story:** Kullanıcı olarak, görselleri ve videoları tam ekran veya modal içinde görüntülemek istiyorum, böylece içeriği daha iyi inceleyebilir ve detayları görebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı bir görsele tıkladığında THEN lightbox açılmalı ve görsel tam boyutta gösterilmelidir
2. WHEN lightbox açıkken THEN kullanıcı ok tuşları ile önceki/sonraki görsellere geçebilmelidir
3. WHEN kullanıcı ESC tuşuna bastığında THEN lightbox kapanmalıdır
4. WHEN lightbox açıkken THEN arka plan scroll devre dışı bırakılmalıdır
5. WHEN görsel yüklenirken THEN loading indicator gösterilmelidir
6. WHEN lightbox içinde THEN zoom in/out fonksiyonalitesi sağlanmalıdır
7. WHEN mobil cihazlarda THEN swipe gesture'ları desteklenmelidir
8. WHEN lightbox açıkken THEN görsel meta bilgileri (boyut, dil, oy sayısı) gösterilmelidir

### Requirement 9: Performans Optimizasyonu

**User Story:** Kullanıcı olarak, medya galerilerinin hızlı yüklenmesini ve sorunsuz çalışmasını istiyorum, böylece kesintisiz bir deneyim yaşayabilirim.

#### Acceptance Criteria

1. WHEN görseller yüklendiğinde THEN lazy loading kullanılmalıdır
2. WHEN thumbnail'ler gösterildiğinde THEN düşük çözünürlüklü versiyonlar kullanılmalıdır
3. WHEN tam boyut görseller yüklendiğinde THEN progressive loading uygulanmalıdır
4. WHEN API çağrıları yapıldığında THEN gereksiz çağrılar önlenmeli ve cache kullanılmalıdır
5. WHEN çok sayıda görsel varsa THEN virtual scrolling veya pagination uygulanmalıdır
6. WHEN bileşenler render edildiğinde THEN React.memo ve useMemo kullanılarak gereksiz re-render'lar önlenmelidir

### Requirement 10: Responsive Tasarım ve Mobil Uyumluluk

**User Story:** Mobil cihaz kullanıcısı olarak, medya galerilerinin mobil cihazlarda da mükemmel çalışmasını istiyorum, böylece her cihazda aynı kalitede deneyim yaşayabilirim.

#### Acceptance Criteria

1. WHEN galeri mobil cihazda görüntülendiğinde THEN grid layout responsive olmalıdır
2. WHEN kullanıcı mobil cihazda gezinirken THEN touch gesture'ları (swipe, pinch-to-zoom) desteklenmelidir
3. WHEN lightbox mobil cihazda açıldığında THEN tam ekran modunda açılmalıdır
4. WHEN görseller mobil cihazda yüklendiğinde THEN uygun boyutlarda görseller kullanılmalıdır
5. WHEN video oynatıldığında THEN mobil cihazlarda native video player kullanılmalıdır
