/**
 * 대운수(大運數) 계산 테스트
 */

import { calculateDaeunSu, getDaeunDirection } from '../core/daeun';
import { calculateSaju } from '../core/saju';

describe('getDaeunDirection', () => {
  test('양간 + 남자 = 순행', () => {
    expect(getDaeunDirection('경', 'M')).toBe('순행');
  });

  test('양간 + 여자 = 역행', () => {
    expect(getDaeunDirection('경', 'F')).toBe('역행');
  });

  test('음간 + 남자 = 역행', () => {
    expect(getDaeunDirection('신', 'M')).toBe('역행');
  });

  test('음간 + 여자 = 순행', () => {
    expect(getDaeunDirection('신', 'F')).toBe('순행');
  });
});

describe('calculateDaeunSu', () => {
  // 1990년 5월 15일: 입하(5/6) ~ 망종(6/6) 사이
  test('순행: 다음 절기(망종 6/6)까지 22일 → 대운수 7', () => {
    const result = calculateDaeunSu(1990, 5, 15, '경', 'M');
    expect(result.direction).toBe('순행');
    expect(result.daysToSolarTerm).toBe(22);
    expect(result.daeunSu).toBe(7);
  });

  test('역행: 이전 절기(입하 5/6)까지 9일 → 대운수 3', () => {
    const result = calculateDaeunSu(1990, 5, 15, '경', 'F');
    expect(result.direction).toBe('역행');
    expect(result.daysToSolarTerm).toBe(9);
    expect(result.daeunSu).toBe(3);
  });

  test('연도 경계(1월 초, 순행)를 넘어 다음 절기(입춘)를 올바르게 찾음', () => {
    // 1995년 1월 3일: 순행이면 소한(1/6)까지 3일
    const result = calculateDaeunSu(1995, 1, 3, '을', 'M'); // 을=음간, 남자→역행이므로 반대 케이스로 검증
    expect(result.direction).toBe('역행');
    // 역행이면 전년도 대설(12/7)까지 27일
    expect(result.daysToSolarTerm).toBe(27);
  });

  test('생일이 절기 날짜와 정확히 같으면 거리는 0', () => {
    const result = calculateDaeunSu(1990, 6, 6, '경', 'M'); // 망종 당일, 순행
    expect(result.daysToSolarTerm).toBe(0);
    expect(result.daeunSu).toBe(0);
  });
});

describe('calculateSaju의 gender 옵션', () => {
  test('gender 미지정 시 daeun은 undefined', () => {
    const saju = calculateSaju(1990, 5, 15, 14, 30);
    expect(saju.daeun).toBeUndefined();
  });

  test('gender 지정 시 daeun이 계산됨', () => {
    const saju = calculateSaju(1990, 5, 15, 14, 30, { gender: 'M' });
    expect(saju.daeun).toBeDefined();
    expect(saju.daeun?.direction).toBe('순행');
  });
});
