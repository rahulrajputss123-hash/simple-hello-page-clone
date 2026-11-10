import { describe, it, expect } from 'vitest';
import { filterOffersByPlatform } from '../platform.server';

describe('filterOffersByPlatform', () => {
  const createOffer = (devices: string[], title = 'Test Offer') => ({
    id: 'test-id',
    title,
    description: 'Test description',
    rewardAmount: 100,
    icon: 'icon.png',
    countries: ['IN'],
    devices,
    category: null,
    provider_name: 'Test Provider',
    level: null,
    disclaimer: null,
  });

  it('should keep offers with empty devices array (available on all platforms)', () => {
    const offers = [createOffer([])];
    expect(filterOffersByPlatform(offers, 'android')).toEqual(offers);
    expect(filterOffersByPlatform(offers, 'ios')).toEqual(offers);
    expect(filterOffersByPlatform(offers, 'web')).toEqual(offers);
  });

  it('should keep offers that include the user platform', () => {
    const androidOffer = createOffer(['android']);
    const iosOffer = createOffer(['ios']);
    const webOffer = createOffer(['web']);

    expect(filterOffersByPlatform([androidOffer], 'android')).toEqual([androidOffer]);
    expect(filterOffersByPlatform([iosOffer], 'ios')).toEqual([iosOffer]);
    expect(filterOffersByPlatform([webOffer], 'web')).toEqual([webOffer]);
  });

  it('should filter out offers that do not match user platform', () => {
    const androidOffer = createOffer(['android']);
    const iosOffer = createOffer(['ios']);

    expect(filterOffersByPlatform([androidOffer], 'ios')).toEqual([]);
    expect(filterOffersByPlatform([iosOffer], 'android')).toEqual([]);
    expect(filterOffersByPlatform([androidOffer], 'web')).toEqual([]);
  });

  it('should handle multi-platform offers', () => {
    const multiOffer = createOffer(['android', 'ios', 'web']);

    expect(filterOffersByPlatform([multiOffer], 'android')).toEqual([multiOffer]);
    expect(filterOffersByPlatform([multiOffer], 'ios')).toEqual([multiOffer]);
    expect(filterOffersByPlatform([multiOffer], 'web')).toEqual([multiOffer]);
  });

  it('should filter mixed offer list correctly', () => {
    const offers = [
      createOffer(['android'], 'Android Only'),
      createOffer(['ios'], 'iOS Only'),
      createOffer(['web'], 'Web Only'),
      createOffer(['android', 'ios'], 'Mobile'),
      createOffer([], 'All Platforms'),
    ];

    const androidResults = filterOffersByPlatform(offers, 'android');
    expect(androidResults).toHaveLength(3);
    expect(androidResults.map(o => o.title)).toEqual([
      'Android Only',
      'Mobile',
      'All Platforms',
    ]);

    const iosResults = filterOffersByPlatform(offers, 'ios');
    expect(iosResults).toHaveLength(3);
    expect(iosResults.map(o => o.title)).toEqual([
      'iOS Only',
      'Mobile',
      'All Platforms',
    ]);

    const webResults = filterOffersByPlatform(offers, 'web');
    expect(webResults).toHaveLength(2);
    expect(webResults.map(o => o.title)).toEqual([
      'Web Only',
      'All Platforms',
    ]);
  });

  it('should handle empty offer list', () => {
    expect(filterOffersByPlatform([], 'android')).toEqual([]);
  });

  it('should handle offers from database with Games category', () => {
    const gamesOffers = [
      createOffer(['android'], 'Raid Shadow Legends'),
      createOffer(['ios'], 'Clash of Clans'),
      createOffer(['web'], 'World of Warships'),
      createOffer(['android', 'ios', 'web'], 'Multi-platform Game'),
    ];

    const androidGames = filterOffersByPlatform(gamesOffers, 'android');
    expect(androidGames).toHaveLength(2);
    expect(androidGames.map(o => o.title)).toContain('Raid Shadow Legends');
    expect(androidGames.map(o => o.title)).toContain('Multi-platform Game');

    const iosGames = filterOffersByPlatform(gamesOffers, 'ios');
    expect(iosGames).toHaveLength(2);
    expect(iosGames.map(o => o.title)).toContain('Clash of Clans');
    expect(iosGames.map(o => o.title)).toContain('Multi-platform Game');

    const webGames = filterOffersByPlatform(gamesOffers, 'web');
    expect(webGames).toHaveLength(2);
    expect(webGames.map(o => o.title)).toContain('World of Warships');
    expect(webGames.map(o => o.title)).toContain('Multi-platform Game');
  });
});
