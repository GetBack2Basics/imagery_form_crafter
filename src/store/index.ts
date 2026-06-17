export const withDefaultSource = (createState: any) => (set: any) => {
  const state = createState(set, {}, {})(set, {}, {});
  const sources = (state as any).sources || [];
  if (!sources.find((s: any) => s.id === 'open-global-stac')) {
    (state as any).sources = [
      {
        id: 'open-global-stac',
        name: 'Open Global STAC',
        url: 'https://earth-search.aws.element84.com/v1',
        type: 'STAC',
        isActive: false,
      },
      ...sources,
    ];
  }
  return state as any;
};
