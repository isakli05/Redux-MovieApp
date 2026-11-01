import { useSEO } from '@hooks/useSEO'
import { HomeHero } from '@components/Home/HomeHero'
import { TrendingRail } from '@components/Home/TrendingRail'
import { NowPlayingBand } from '@components/Home/NowPlayingBand'
import { UpcomingRail } from '@components/Home/UpcomingRail'
import { CriticsRail } from '@components/Home/CriticsRail'
import { HiddenGemsRail } from '@components/Home/HiddenGemsRail'
import { FreeRail } from '@components/Home/FreeRail'
import { TrendingTvRail } from '@components/Home/TrendingTvRail'
import { RecentsRail } from '@components/Home/RecentsRail'
import { ExperiencesBand } from '@components/Home/ExperiencesBand'

/** Spec §3 ritmi: py-16 md:py-20, max-w-[1440px] container, spec olukları. */
const SECTION_CLASS = 'mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 md:py-20 lg:px-8'
/** Hero'ya bitişik ilk bölüm: üst boşluk sıkı (hero zaten alt pad veriyor). */
const FIRST_SECTION_CLASS = 'mx-auto w-full max-w-[1440px] px-4 pt-10 pb-16 sm:px-6 md:pt-14 md:pb-20 lg:px-8'

/**
 * Home — "Cinematic Atlas" mavi baskısı (DESIGN_DIRECTION.md §6):
 * BackdropHero (trending/day ilk 3, çapraz geçiş) → Bugün Trend → Vizyonda
 * (editoryal bant) → Yakında → Eleştirmenlerin Seçtikleri → Gizli Cevherler →
 * Ücretsiz İzle (region + JustWatch) → Dizilerde Trend → Son Baktıklarınız.
 * Sahte istatistik yok (defect T); Swiper yok; her ray kendi hatasını yönetir.
 */
function Home() {
  useSEO({
    title: 'Film ve Dizi Keşif',
    description:
      'Bugün trend olan filmler ve diziler, vizyondaki yapımlar, eleştirmenlerin seçtikleri, gizli cevherler ve bölgenizde ücretsiz izleyebilecekleriniz.',
  })

  return (
    <div className="min-h-screen bg-surface-void">
      <HomeHero />

      <TrendingRail className={FIRST_SECTION_CLASS} />

      <div className="bg-surface-base">
        <NowPlayingBand className={SECTION_CLASS} />
      </div>

      <UpcomingRail className={SECTION_CLASS} />

      <div className="bg-surface-base">
        <CriticsRail className={SECTION_CLASS} />
      </div>

      <HiddenGemsRail className={SECTION_CLASS} />

      <div className="bg-surface-base">
        <FreeRail className={SECTION_CLASS} />
      </div>

      <TrendingTvRail className={SECTION_CLASS} />

      <div className="bg-surface-base">
        <RecentsRail className={SECTION_CLASS} />
      </div>

      <ExperiencesBand className={SECTION_CLASS} />
    </div>
  )
}

export default Home
