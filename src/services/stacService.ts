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
  limit = 20,
  collection = 'sentinel-2-l2a',
): Promise<StacItem[]> {
  const [minx, miny, maxx, maxy] = bbox;

  const body = {
    bbox: [minx, miny, maxx, maxy],
    limit,
    collections: [collection],
  };

  const res = await fetch(`${stacApiUrl}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STAC request failed: ${res.status} - ${text}`);
  }

  const json = await res.json();
  const items = (json.features as StacItem[]) ?? [];

  // Sort client-side by datetime (desc) since API no longer supports sortby
  return items.sort((a, b) => {
    const da = a.properties.datetime ? new Date(a.properties.datetime).getTime() : 0;
    const db = b.properties.datetime ? new Date(b.properties.datetime).getTime() : 0;
    return db - da;
  });
}
