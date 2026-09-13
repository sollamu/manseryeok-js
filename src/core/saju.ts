/**
 * 사주팔자 계산 모듈
 *
 * 사주팔자(년주, 월주, 일주, 시주)를 계산합니다.
 */

import { getGapja } from './solar-lunar-converter';
import { calculateDaeunSu, type DaeunInfo, type Gender } from './daeun';
import type { GapjaResult } from '../types';

/**
 * 사주팔자 타입
 */
export interface SajuResult {
  /** 년주 (년柱) */
  yearPillar: string;
  /** 년주 한자 */
  yearPillarHanja: string;
  /** 월주 (월柱) */
  monthPillar: string;
  /** 월주 한자 */
  monthPillarHanja: string;
  /** 일주 (일柱) */
  dayPillar: string;
  /** 일주 한자 */
  dayPillarHanja: string;
  /** 시주 (시柱) - 시간 미입력 시 null */
  hourPillar: string | null;
  /** 시주 한자 */
  hourPillarHanja: string | null;
  /** 원본 갑자 정보 */
  gapja: GapjaResult;
  /** 시간 보정이 적용되었는지 여부 */
  isTimeCorrected: boolean;
  /** 보정된 시간 (분 단위) */
  correctedTime?: { hour: number; minute: number };
  /** 대운수 정보 - options.gender 입력 시에만 계산됨 */
  daeun?: DaeunInfo;
}

/**
 * 사주 계산 옵션
 */
export interface SajuOptions {
  /** 경도 (기본값: 127 - 서울) */
  longitude?: number;
  /** 시간 보정 적용 여부 (기본값: true) */
  applyTimeCorrection?: boolean;
  /** 성별 - 지정하면 대운수(daeun)를 함께 계산 */
  gender?: Gender;
}

/**
 * 사주팔자 계산
 *
 * @param solarYear 양력 년
 * @param solarMonth 양력 월 (1~12)
 * @param solarDay 양력 일 (1~31)
 * @param solarHour 양력 시 (0~23)
 * @param solarMinute 양력 분 (0~59, 기본값: 0)
 * @param options 사주 계산 옵션
 * @returns 사주팔자 정보
 */
export function calculateSaju(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  solarHour?: number,
  solarMinute: number = 0,
  options: SajuOptions = {}
): SajuResult {
  const {
    longitude = 127,
    applyTimeCorrection = true,
    gender,
  } = options;

  // 갑자 계산 (년주, 월주, 일주)
  const gapja = getGapja(solarYear, solarMonth, solarDay);

  // 대운수 계산 (성별이 주어진 경우에만)
  const daeun = gender
    ? calculateDaeunSu(solarYear, solarMonth, solarDay, gapja.yearPillar.charAt(0), gender)
    : undefined;

  // 시주 계산
  let hourPillar: string | null = null;
  let hourPillarHanja: string | null = null;
  let isTimeCorrected = false;
  let correctedTime: { hour: number; minute: number } | undefined;

  if (solarHour !== undefined) {
    let calcHour = solarHour;
    let calcMinute = solarMinute;

    // 시간 보정 (진태양시)
    if (applyTimeCorrection) {
      const standardMeridian = 135; // 한국 표준시 자오선 (UTC+9)
      const degreesDiff = standardMeridian - longitude;
      const longitudeCorrection = Math.round(degreesDiff * 4); // 1도 = 4분

      calcMinute = solarMinute - longitudeCorrection;
      calcHour = solarHour;

      if (calcMinute < 0) {
        calcMinute += 60;
        calcHour -= 1;
      }
      if (calcHour < 0) {
        calcHour += 24;
      }

      if (longitudeCorrection !== 0) {
        isTimeCorrected = true;
        correctedTime = { hour: calcHour, minute: calcMinute };
      }
    }

    // 시지 결정 (백엔드와 동일한 로직)
    let hourBranchId: number;
    if (calcHour === 23 || calcHour === 0) {
      hourBranchId = 0; // 자시
    } else {
      hourBranchId = Math.floor((calcHour + 1) / 2);
    }

    // 오자시두법으로 시천간 결정
    const dayStem = gapja.dayPillar.charAt(0);
    const hourStemStart = getHourStemStart(dayStem);
    const hourStemId = (hourStemStart + hourBranchId) % 10;

    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const stemChars = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const branchChars = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    hourPillar = stems[hourStemId] + branches[hourBranchId];
    hourPillarHanja = stemChars[hourStemId] + branchChars[hourBranchId];
  }

  return {
    yearPillar: gapja.yearPillar,
    yearPillarHanja: gapja.yearPillarHanja,
    monthPillar: gapja.monthPillar,
    monthPillarHanja: gapja.monthPillarHanja,
    dayPillar: gapja.dayPillar,
    dayPillarHanja: gapja.dayPillarHanja,
    hourPillar,
    hourPillarHanja,
    gapja,
    isTimeCorrected,
    correctedTime,
    daeun,
  };
}

/**
 * 오자시두법에 따른 자시 천간 시작점
 *
 * 일간에 따라 자시의 천간이 다릅니다:
 * - 갑/기일: 자시부터 갑자, 을축, 병인, ...
 * - 을/경일: 자시부터 병자, 정축, 무인, ...
 * - 병/신일: 자시부터 무자, 기축, 경인, ...
 * - 정/임일: 자시부터 경자, 신축, 임인, ...
 * - 무/계일: 자시부터 임자, 계축, 갑인, ...
 */
function getHourStemStart(dayStem: string): number {
  const stemMap: { [key: string]: number } = {
    갑: 0,
    기: 0,  // 갑/기 → 자시부터 갑자 (갑=0)
    을: 2,
    경: 2,  // 을/경 → 자시부터 병자 (병=2)
    병: 4,
    신: 4,  // 병/신 → 자시부터 무자 (무=4)
    정: 6,
    임: 6,  // 정/임 → 자시부터 경자 (경=6)
    무: 8,
    계: 8,  // 무/계 → 자시부터 임자 (임=8)
  };

  return stemMap[dayStem] ?? 0;
}

/**
 * 간단한 사주 계산 (시간 보정 없음)
 *
 * @param solarYear 양력 년
 * @param solarMonth 양력 월 (1~12)
 * @param solarDay 양력 일 (1~31)
 * @param solarHour 양력 시 (0~23, 선택사항)
 * @returns 사주팔자 정보
 */
export function calculateSajuSimple(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  solarHour?: number
): SajuResult {
  return calculateSaju(solarYear, solarMonth, solarDay, solarHour, 0, {
    applyTimeCorrection: false,
  });
}
