export type PublicPlace = {
  id: string;
  name: string;
  region: string;
  category: string;
  tags: string[];
  description: string;
  address: string;
  lat?: number;
  lng?: number;
};

const regionFiles = [
  { label: '서울', path: '/data/서울/서울_관광지.json' },
  { label: '서울', path: '/data/서울/서울_쇼핑.json' },
  { label: '서울', path: '/data/서울/서울_문화시설.json' },
  { label: '부산', path: '/data/부산/부산_관광지.json' },
  { label: '부산', path: '/data/부산/부산_쇼핑.json' },
  { label: '부산', path: '/data/부산/부산_문화시설.json' },
  { label: '광주/전라권', path: '/data/광주_전라권/광주_전라권_관광지.json' },
  { label: '광주/전라권', path: '/data/광주_전라권/광주_전라권_쇼핑.json' },
  { label: '광주/전라권', path: '/data/광주_전라권/광주_전라권_문화시설.json' },
  { label: '대전/충청권', path: '/data/대전_충청권/대전_충청권_관광지.json' },
  { label: '대전/충청권', path: '/data/대전_충청권/대전_충청권_쇼핑.json' },
  { label: '대전/충청권', path: '/data/대전_충청권/대전_충청권_문화시설.json' },
  { label: '구미/경북권', path: '/data/구미_경북권/구미_경북권_관광지.json' },
  { label: '구미/경북권', path: '/data/구미_경북권/구미_경북권_쇼핑.json' },
  { label: '구미/경북권', path: '/data/구미_경북권/구미_경북권_문화시설.json' },
];

const extractItems = (dataset: any): any[] => {
  if (!dataset) return [];
  if (Array.isArray(dataset)) return dataset;
  if (Array.isArray(dataset.items)) return dataset.items;
  const nested = dataset?.response?.body?.items?.item;
  if (nested) return Array.isArray(nested) ? nested : [nested];
  if (Array.isArray(dataset.result?.items)) return dataset.result.items;
  if (Array.isArray(dataset.data)) return dataset.data;
  return [];
};

export async function loadPublicCatalog(perRegionLimit = 40): Promise<PublicPlace[]> {
  try {
    const datasets = await Promise.all(
      responses.map(async (response, idx) => {
        if (!response.ok) {
          console.warn('Failed to fetch', regionFiles[idx]?.path, response.status);
          return null;
        }
        try {
          return await response.json();
        } catch (e) {
          console.warn('Invalid JSON:', regionFiles[idx]?.path, e);
          return null;
        }
      }),
    );

    const itemsWithLabel = datasets
      .map((dataset: any, index: number) => {
        const items = extractItems(dataset);
        return (items || []).map((item: any) => ({
          item,
          label: regionFiles[index]?.label ?? '알 수 없음',
        }));
      })
      .flat();

    const grouped = new Map<string, { item: any; label: string }[]>();
    itemsWithLabel.forEach(({ item, label }) => {
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push({ item, label });
    });

    const balancedItems = Array.from(grouped.values()).flatMap((group) =>
      group.slice(0, perRegionLimit),
    );

    return balancedItems.map(({ item, label }) => ({
      id: `public-${item.contentid ?? item.CONTENTID ?? item.id ?? item.title ?? Math.random().toString(36).slice(2)}`,
      name: item.title ?? item.name ?? item.facltNm ?? '이름 없음',
      region: label,
      category: '공공데이터',
      tags: ['공공데이터', '추천지향'],
      description:
        item.addr1 ?? item.description ?? item.intro ?? '공공데이터 기반 추천 장소입니다.',
      address: item.addr1 ?? item.addr ?? item.주소 ?? '주소 정보 없음',
      lat: item.mapy ? Number(item.mapy) : undefined,
      lng: item.mapx ? Number(item.mapx) : undefined,
    }));
  } catch (e) {
    console.error('loadPublicCatalog error', e);
    return [];
  }
}
