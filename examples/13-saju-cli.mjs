/**
 * 사주팔자 CLI (연월일시분 직접 입력)
 *
 * 사용법:
 *   node examples/13-saju-cli.mjs <년> <월> <일> [시] [분] [경도] [성별M/F]
 *
 * 예시:
 *   node examples/13-saju-cli.mjs 1990 5 15 14 30
 *   node examples/13-saju-cli.mjs 1990 5 15 14 0 129
 *   node examples/13-saju-cli.mjs 1990 5 15 14 30 127 M
 */

import { calculateSaju } from '../dist/index.mjs';

const args = process.argv.slice(2);
const gender = args.find((a) => a === 'M' || a === 'F');
const [year, month, day, hour, minute, longitude] = args
  .filter((a) => a !== gender)
  .map(Number);

if (!year || !month || !day) {
  console.log('사용법: node examples/13-saju-cli.mjs <년> <월> <일> [시] [분] [경도] [성별M/F]');
  process.exit(1);
}

const options = { ...(longitude ? { longitude } : {}), ...(gender ? { gender } : {}) };
const saju = calculateSaju(year, month, day, hour, minute, options);

console.log(`입력: ${year}년 ${month}월 ${day}일${hour !== undefined ? ` ${hour}시` : ''}${minute !== undefined ? ` ${minute}분` : ''}`);
console.log(`년주: ${saju.yearPillar} (${saju.yearPillarHanja})`);
console.log(`월주: ${saju.monthPillar} (${saju.monthPillarHanja})`);
console.log(`일주: ${saju.dayPillar} (${saju.dayPillarHanja})`);
console.log(`시주: ${saju.hourPillar} (${saju.hourPillarHanja})`);
if (saju.isTimeCorrected) {
  console.log(`시간 보정: ${saju.correctedTime.hour}시 ${saju.correctedTime.minute}분 (진태양시)`);
}
if (saju.daeun) {
  console.log(`대운수: ${saju.daeun.daeunSu} (${saju.daeun.direction}, 절기까지 ${saju.daeun.daysToSolarTerm}일)`);
}
