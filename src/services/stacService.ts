export interface StacItem {
  id: string;
  properties: {
    datetime?: string;
    'dea:product_id'?: string;
    'dea:region_code'?: string;
    'sentinel:product_id'?: string;
    datetakesensingstart?: string;
  };
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
  bbox?: [number, number, number, number];
  assets?: Record<string, { href: string }>;
}

export async function fetchRecentItems(
  stacApiUrl: string,
  bbox: [number, number, number, number],
  limit = 2,
): Promise<StacItem[]> {
  const [minx, miny, maxx, maxy] = bbox;

  const url = new URL(`${stacApiUrl}/search`);
  url.searchParams.set('bbox', `${minx},${miny},${maxx},${maxy}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('sortby', 'datetime');
  url.searchParams.set('order', 'desc');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`STAC request failed: ${res.status}`);
  }

  const json = await res.json();
  return (json.features as StacItem[]) ?? [];
}
