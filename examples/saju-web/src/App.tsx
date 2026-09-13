import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateSaju, type Gender } from '@fullstackfamily/manseryeok'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ParsedDatetime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function parseDatetime(digits: string): ParsedDatetime | null {
  if (!/^\d{12}$/.test(digits)) return null
  return {
    year: Number(digits.slice(0, 4)),
    month: Number(digits.slice(4, 6)),
    day: Number(digits.slice(6, 8)),
    hour: Number(digits.slice(8, 10)),
    minute: Number(digits.slice(10, 12)),
  }
}

const CITY_OPTIONS = [
  { value: 'seoul', label: '서울/인천/경기', longitude: 127 },
  { value: 'daejeon', label: '대전/충청', longitude: 127 },
  { value: 'gwangju', label: '광주/전라', longitude: 127 },
  { value: 'busan', label: '부산/울산/경남', longitude: 129 },
  { value: 'daegu', label: '대구/경북', longitude: 129 },
  { value: 'gangwon', label: '강원', longitude: 128 },
  { value: 'jeju', label: '제주', longitude: 126 },
  { value: 'custom', label: '직접 입력 (경도)', longitude: null },
] as const

// 입력 중인 숫자를 자른 위치까지만 YYYY/MM/DD HH:mm 형태로 보여준다 (예: "19730" -> "1973/0")
function formatPartial(digits: string): string {
  const parts = [
    digits.slice(0, 4),
    digits.slice(4, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
    digits.slice(10, 12),
  ]
  let text = parts[0]
  if (parts[1]) text += '/' + parts[1]
  if (parts[2]) text += '/' + parts[2]
  if (parts[3]) text += ' ' + parts[3]
  if (parts[4]) text += ':' + parts[4]
  return text
}

function App() {
  const [raw, setRaw] = useState(formatPartial('199005151430'))
  const [city, setCity] = useState<(typeof CITY_OPTIONS)[number]['value']>('seoul')
  const [customLongitude, setCustomLongitude] = useState('127')
  const [gender, setGender] = useState<Gender | ''>('')
  const datetimeInputRef = useRef<HTMLInputElement>(null)

  const longitude =
    city === 'custom'
      ? Number(customLongitude) || 127
      : (CITY_OPTIONS.find((c) => c.value === city)?.longitude ?? 127)

  const digits = raw.replace(/\D/g, '')
  const parsed = parseDatetime(digits)

  // 입력란 자체를 숫자만 추출해 YYYY/MM/DD HH:mm 형태로 다시 표시한다
  useEffect(() => {
    const el = datetimeInputRef.current
    if (el) el.setSelectionRange(el.value.length, el.value.length)
  }, [raw])

  const result = useMemo(() => {
    if (!parsed) return null
    try {
      return calculateSaju(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute, {
        longitude,
        gender: gender || undefined,
      })
    } catch (err) {
      return { error: (err as Error).message } as const
    }
  }, [parsed, longitude, gender])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">사주팔자 계산기</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="datetime" className="text-base">
              생년월일시 (숫자만 순서대로 입력, 예: 197305111037)
            </Label>
            <Input
              id="datetime"
              ref={datetimeInputRef}
              inputMode="numeric"
              placeholder="1973/05/11 10:37"
              value={raw}
              onChange={(e) => setRaw(formatPartial(e.target.value.replace(/\D/g, '').slice(0, 12)))}
              className="h-20 font-mono text-4xl font-bold tracking-wide md:text-4xl"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gender" className="text-base">
              성별
            </Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger id="gender" className="h-12 w-full text-xl">
                <SelectValue placeholder="선택 안 함 (대운수 계산 안 함)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">남자</SelectItem>
                <SelectItem value="F">여자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city" className="text-base">
              출생지
            </Label>
            <Select value={city} onValueChange={(v) => setCity(v as (typeof CITY_OPTIONS)[number]['value'])}>
              <SelectTrigger id="city" className="h-12 w-full text-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {city === 'custom' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="longitude" className="text-base">
                경도
              </Label>
              <Input
                id="longitude"
                type="number"
                value={customLongitude}
                onChange={(e) => setCustomLongitude(e.target.value)}
                className="h-12 text-xl"
              />
            </div>
          )}

          <div className="min-h-32 rounded-lg border bg-muted/30 p-4 font-mono text-xl">
            {!parsed && <p className="text-muted-foreground">12자리 숫자를 모두 입력하세요.</p>}
            {parsed && result && 'error' in result && (
              <p className="text-destructive">{result.error}</p>
            )}
            {parsed && result && !('error' in result) && (
              <div className="flex flex-col gap-1">
                <p>
                  년주: {result.yearPillar} ({result.yearPillarHanja})
                </p>
                <p>
                  월주: {result.monthPillar} ({result.monthPillarHanja})
                </p>
                <p>
                  일주: {result.dayPillar} ({result.dayPillarHanja})
                </p>
                <p>
                  시주: {result.hourPillar} ({result.hourPillarHanja})
                </p>
                {result.daeun && (
                  <p>
                    대운수: {result.daeun.daeunSu} ({result.daeun.direction}, 절기까지{' '}
                    {result.daeun.daysToSolarTerm}일)
                  </p>
                )}
                {result.isTimeCorrected && result.correctedTime && (
                  <details className="text-muted-foreground text-base">
                    <summary className="cursor-pointer">상세보기</summary>
                    시간 보정: {result.correctedTime.hour}시 {result.correctedTime.minute}분 (진태양시)
                  </details>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
