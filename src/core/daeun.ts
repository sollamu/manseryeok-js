/**
 * 대운수(大運數) 계산 모듈
 *
 * 대운수는 첫 대운이 시작되는 나이입니다. 생일을 기준으로 순행/역행 방향에 있는
 * 가장 가까운 절기(節氣, 중기 제외 12개)까지의 날짜 수를 3으로 나누어 구합니다.
 *
 * @remarks
 * 절기 시각은 연도별 정밀 데이터(2020~2030년만 지원)가 아니라 매년 거의 고정적인
 * 평균 날짜(JEOLGI_APPROX_DATES)를 사용하므로, 1900~2050년 전체에서 동작하는
 * 대신 하루 이내의 오차가 있을 수 있는 근사치입니다.
 */

import { JEOLGI_APPROX_DATES } from '../data/solar-terms';

/** 성별 (대운 순행/역행 방향 결정에 사용) */
export type Gender = 'M' | 'F';

/** 양간(陽干) 목록 */
const YANG_STEMS = ['갑', '병', '무', '경', '임'];

/**
 * 대운수 계산 결과
 */
export interface DaeunInfo {
  /** 대운 방향 (순행: 미래 절기 방향, 역행: 과거 절기 방향) */
  direction: '순행' | '역행';
  /** 대운수 (첫 대운이 시작되는 나이) */
  daeunSu: number;
  /** 기준이 된 절기까지의 날짜 수 (근사치) */
  daysToSolarTerm: number;
}

function isYangYearStem(yearStem: string): boolean {
  return YANG_STEMS.includes(yearStem);
}

/**
 * 년간과 성별로 대운 방향을 결정합니다.
 * 양남음녀(양년+남자, 음년+여자)는 순행, 음남양녀는 역행입니다.
 */
export function getDaeunDirection(yearStem: string, gender: Gender): '순행' | '역행' {
  const isYang = isYangYearStem(yearStem);
  const isMale = gender === 'M';
  return isYang === isMale ? '순행' : '역행';
}

/**
 * 생일 기준으로 주어진 방향에서 가장 가까운 절기 날짜와의 일수 차이를 구합니다.
 * 절기는 연도 구분 없이 매년 반복되는 근사 날짜(JEOLGI_APPROX_DATES)를 사용합니다.
 */
function daysToNearestJeolgi(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  direction: '순행' | '역행'
): number {
  const birthDate = new Date(solarYear, solarMonth - 1, solarDay);

  // 연도 경계를 넘나드는 탐색을 위해 전/현재/다음 연도의 절기 후보를 모두 생성
  const candidates: Date[] = [];
  for (const yearOffset of [-1, 0, 1]) {
    for (const term of JEOLGI_APPROX_DATES) {
      candidates.push(new Date(solarYear + yearOffset, term.month - 1, term.day));
    }
  }

  const msPerDay = 24 * 60 * 60 * 1000;

  if (direction === '순행') {
    const future = candidates
      .filter((d) => d.getTime() >= birthDate.getTime())
      .sort((a, b) => a.getTime() - b.getTime());
    const target = future[0];
    return Math.round((target.getTime() - birthDate.getTime()) / msPerDay);
  }

  const past = candidates
    .filter((d) => d.getTime() <= birthDate.getTime())
    .sort((a, b) => b.getTime() - a.getTime());
  const target = past[0];
  return Math.round((birthDate.getTime() - target.getTime()) / msPerDay);
}

/**
 * 대운수를 계산합니다.
 *
 * @param solarYear 양력 년
 * @param solarMonth 양력 월 (1~12)
 * @param solarDay 양력 일 (1~31)
 * @param yearStem 년간 (예: getGapja/calculateSaju 결과의 yearPillar 첫 글자)
 * @param gender 성별 ('M' | 'F')
 * @returns 대운수 정보
 */
export function calculateDaeunSu(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  yearStem: string,
  gender: Gender
): DaeunInfo {
  const direction = getDaeunDirection(yearStem, gender);
  const daysToSolarTerm = daysToNearestJeolgi(solarYear, solarMonth, solarDay, direction);
  const daeunSu = Math.round(daysToSolarTerm / 3);

  return { direction, daeunSu, daysToSolarTerm };
}
