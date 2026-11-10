import { describe, it, expect } from 'vitest';
import { normalizeDevices } from '../normalize-devices';

describe('normalizeDevices', () => {
  it('should normalize desktop to web', () => {
    expect(normalizeDevices(['desktop'])).toEqual(['web']);
    expect(normalizeDevices(['Desktop'])).toEqual(['web']);
    expect(normalizeDevices(['DESKTOP'])).toEqual(['web']);
  });

  it('should normalize PC to web', () => {
    expect(normalizeDevices(['PC'])).toEqual(['web']);
    expect(normalizeDevices(['pc'])).toEqual(['web']);
    expect(normalizeDevices(['Pc'])).toEqual(['web']);
  });

  it('should normalize mobile to android and ios', () => {
    expect(normalizeDevices(['mobile'])).toEqual(['android', 'ios']);
    expect(normalizeDevices(['Mobile'])).toEqual(['android', 'ios']);
    expect(normalizeDevices(['MOBILE'])).toEqual(['android', 'ios']);
  });

  it('should lowercase standard platforms', () => {
    expect(normalizeDevices(['Android'])).toEqual(['android']);
    expect(normalizeDevices(['IOS'])).toEqual(['ios']);
    expect(normalizeDevices(['iOS'])).toEqual(['ios']);
    expect(normalizeDevices(['Web'])).toEqual(['web']);
  });

  it('should remove duplicates', () => {
    expect(normalizeDevices(['android', 'Android', 'ANDROID'])).toEqual(['android']);
    expect(normalizeDevices(['ios', 'iOS', 'IOS'])).toEqual(['ios']);
    expect(normalizeDevices(['android', 'ios', 'android'])).toEqual(['android', 'ios']);
  });

  it('should skip wildcard values', () => {
    expect(normalizeDevices(['*'])).toEqual([]);
    expect(normalizeDevices(['All'])).toEqual([]);
    expect(normalizeDevices(['all'])).toEqual([]);
    expect(normalizeDevices(['ALL'])).toEqual([]);
  });

  it('should handle mixed arrays with wildcards', () => {
    expect(normalizeDevices(['android', '*'])).toEqual(['android']);
    expect(normalizeDevices(['All', 'ios'])).toEqual(['ios']);
  });

  it('should sort alphabetically', () => {
    expect(normalizeDevices(['web', 'android', 'ios'])).toEqual(['android', 'ios', 'web']);
    expect(normalizeDevices(['ios', 'android'])).toEqual(['android', 'ios']);
  });

  it('should handle empty arrays', () => {
    expect(normalizeDevices([])).toEqual([]);
  });

  it('should handle complex mixed cases', () => {
    expect(normalizeDevices(['Desktop', 'Android', 'iOS'])).toEqual(['android', 'ios', 'web']);
    expect(normalizeDevices(['android', 'ios', 'desktop', 'android'])).toEqual(['android', 'ios', 'web']);
    expect(normalizeDevices(['Mobile', 'Web'])).toEqual(['android', 'ios', 'web']);
  });

  it('should filter out unknown platforms (only keep android, ios, web)', () => {
    expect(normalizeDevices(['unknown'])).toEqual([]);
    expect(normalizeDevices(['android', 'unknown', 'ios'])).toEqual(['android', 'ios']);
    expect(normalizeDevices(['strange-device'])).toEqual([]);
  });
});
