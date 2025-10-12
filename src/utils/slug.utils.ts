/**
 * Film/Dizi başlığından slug oluşturur
 * @param id - TMDB ID
 * @param title - Film/Dizi başlığı
 * @returns Slug (örn: "123-the-matrix")
 */
export const createSlug = (id: number, title: string): string => {
  const cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/[.,:\s]+/g, '-') // Nokta, virgül, iki nokta ve boşlukları tire ile değiştir
    .replace(/-+/g, '-') // Birden fazla tireyi tek tire yap
    .replace(/^-|-$/g, '') // Başındaki ve sonundaki tireleri kaldır
    .replace(/[^a-z0-9-]/g, ''); // Sadece harf, rakam ve tire bırak

  return `${id}-${cleanTitle}`;
};

/**
 * Slug'dan ID çıkarır
 * @param slug - Slug string (örn: "123-the-matrix")
 * @returns ID veya null
 */
export const extractIdFromSlug = (slug: string | undefined): string | null => {
  if (!slug) return null;
  
  const match = slug.match(/^(\d+)-/);
  return match ? match[1] : null;
};

/**
 * URL-safe string oluşturur
 * @param text - Dönüştürülecek metin
 * @returns URL-safe string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Aksanlı karakterleri ayır
    .replace(/[\u0300-\u036f]/g, '') // Aksan işaretlerini kaldır
    .replace(/[^\w\s-]/g, '') // Özel karakterleri kaldır
    .replace(/\s+/g, '-') // Boşlukları tire yap
    .replace(/-+/g, '-') // Birden fazla tireyi tek tire yap
    .replace(/^-|-$/g, ''); // Başındaki ve sonundaki tireleri kaldır
};

