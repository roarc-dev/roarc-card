/**
 * 웨딩 페이지 컴포넌트 배경색 동적 할당 시스템
 *
 * 요구사항:
 * 1. 초대글 섹션(MainSection, InviteName)은 항상 현재 순서 유지 (고정)
 * 2. Info 컴포넌트는 흰색(#ffffff) 배경 금지 (내부 흰색 카드)
 * 3. Gallery 슬라이드형: 바로 밑 컴포넌트와 동일한 배경색 (경계 없음)
 * 4. Gallery 썸네일형: 바로 밑 컴포넌트와 다른 배경색 + 흰색 금지
 * 5. LocationUnified는 흰색(#ffffff) 배경 유지 (회색 지도 버튼)
 * 6. 인접 컴포넌트끼리 배경색이 달라야 함
 * 7. 컴포넌트 내부 버튼 색상과 명도 차이가 충분해야 함
 */

/**
 * 웨딩 페이지 배경색 팔레트
 * 회색 계열만 사용
 */
export const BACKGROUND_COLORS = {
  WHITE: '#ffffff',
  GRAY_50: '#FAFAFA',
  GRAY_100: '#F5F5F5',
  GRAY_150: '#ECECEC',
  GRAY_200: '#ebebeb',
  GRAY_300: '#e0e0e0',
} as const

export type BackgroundColor = typeof BACKGROUND_COLORS[keyof typeof BACKGROUND_COLORS]

/**
 * 동적 배경색 할당에 사용 가능한 색상 배열
 * (명도 순으로 정렬: 밝은 색 → 어두운 색)
 */
export const ASSIGNABLE_COLORS: BackgroundColor[] = [
  BACKGROUND_COLORS.WHITE,
  BACKGROUND_COLORS.GRAY_50,
  BACKGROUND_COLORS.GRAY_100,
  BACKGROUND_COLORS.GRAY_150,
  BACKGROUND_COLORS.GRAY_200,
  BACKGROUND_COLORS.GRAY_300,
]

/**
 * 컴포넌트별 버튼 색상
 * 배경색과의 명도 차이 검증에 사용
 */
export const BUTTON_COLORS: Record<string, string> = {
  CalendarProxy: '#e0e0e0',      // CalendarSection의 하이라이트 및 버튼
  Account: '#EBEBEC',
  RSVPClient: '#e0e0e0',
  CommentBoard: '#ECECEC',
  KakaoShare: '#e0e0e0',
}

/**
 * RGB 색상을 명도 값으로 변환
 * W3C relative luminance 공식 사용
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff

  // sRGB to linear RGB
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  // Relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * 두 색상의 명도 차이가 충분한지 확인
 * @param color1 첫 번째 색상 (hex)
 * @param color2 두 번째 색상 (hex)
 * @returns 명도 차이가 최소 5% 이상이면 true
 */
function hasGoodContrast(color1: string, color2: string): boolean {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const contrast = Math.abs(lum1 - lum2)

  // 최소 5% 명도 차이 필요 (10%에서 완화)
  return contrast >= 0.05
}

/**
 * 컴포넌트 배열에 대해 동적으로 배경색 할당
 *
 * @param components 컴포넌트 타입 배열 (순서대로)
 * @param galleryType 갤러리 타입 ('slide' | 'thumbnail')
 * @returns 각 컴포넌트의 배경색 매핑
 */
export function assignBackgroundColors(
  components: string[],
  galleryType?: 'slide' | 'thumbnail'
): Record<string, BackgroundColor> {
  const result: Record<string, BackgroundColor> = {}

  for (let i = 0; i < components.length; i++) {
    const currentComponent = components[i]
    const prevComponent = i > 0 ? components[i - 1] : null
    const nextComponent = i < components.length - 1 ? components[i + 1] : null

    // 1. 제외 컴포넌트 (배경색 할당 안함)
    if (
      currentComponent === 'bgm' ||
      currentComponent === 'MainSection' ||
      currentComponent === 'InviteName' ||
      currentComponent === 'WeddingContact' ||
      currentComponent === 'CalendarAddBtn' // Placeholder로 처리됨
    ) {
      continue
    }

    // 2. LocationUnified는 흰색 고정
    if (currentComponent === 'LocationUnified') {
      result[currentComponent] = BACKGROUND_COLORS.WHITE
      continue
    }

    // 3. Gallery 특수 처리
    if (currentComponent === 'UnifiedGalleryComplete') {
      if (galleryType === 'slide') {
        // 슬라이드형: 다음 컴포넌트와 동일한 색상
        if (nextComponent && result[nextComponent]) {
          result[currentComponent] = result[nextComponent]
        } else {
          // 다음 컴포넌트가 아직 결정되지 않았으면 임시로 흰색
          result[currentComponent] = BACKGROUND_COLORS.WHITE
        }
      } else {
        // 썸네일형: 다음 컴포넌트와 다른 색상, 흰색 금지
        const nextColor = nextComponent ? result[nextComponent] : null
        const prevColor = prevComponent ? result[prevComponent] : null

        const availableColors = ASSIGNABLE_COLORS.filter(color => {
          if (color === BACKGROUND_COLORS.WHITE) return false // 흰색 금지
          if (nextColor && color === nextColor) return false // 다음과 다름
          if (prevColor && color === prevColor) return false // 이전과 다름
          return true
        })

        result[currentComponent] = availableColors[0] || BACKGROUND_COLORS.GRAY_50
      }
      continue
    }

    // 3. Info 컴포넌트 (흰색 금지)
    if (currentComponent === 'Info') {
      const prevColor = prevComponent ? result[prevComponent] : null
      const nextColor = nextComponent ? result[nextComponent] : null

      const availableColors = ASSIGNABLE_COLORS.filter(color => {
        if (color === BACKGROUND_COLORS.WHITE) return false // 흰색 금지
        if (prevColor && color === prevColor) return false
        if (nextColor && color === nextColor) return false
        return true
      })

      result[currentComponent] = availableColors[0] || BACKGROUND_COLORS.GRAY_200
      continue
    }

    // 4. 나머지 컴포넌트 (CalendarProxy, Account, RSVPClient, CommentBoard, KakaoShare)
    const prevColor = prevComponent ? result[prevComponent] : null
    const nextColor = nextComponent ? result[nextComponent] : null
    const buttonColor = BUTTON_COLORS[currentComponent]

    // 초대글 섹션(MainSection, InviteName) 바로 다음에 오는 컴포넌트인지 확인
    const isAfterInviteSection = prevComponent && (
      prevComponent === 'MainSection' ||
      prevComponent === 'InviteName' ||
      prevComponent === 'bgm'
    )

    const availableColors = ASSIGNABLE_COLORS.filter(color => {
      // 초대글 섹션 바로 다음에 오는 컴포넌트는 흰색 금지 (경계 명확화)
      if (isAfterInviteSection && color === BACKGROUND_COLORS.WHITE) {
        return false
      }

      // 이전/다음 컴포넌트와 색상이 달라야 함
      if (prevColor && color === prevColor) return false
      if (nextColor && color === nextColor) return false

      // 버튼 색상과 명도 차이가 충분해야 함
      if (buttonColor && !hasGoodContrast(color, buttonColor)) return false

      return true
    })

    // 사용 가능한 색상 중 첫 번째 선택
    result[currentComponent] = availableColors[0] || BACKGROUND_COLORS.GRAY_100
  }

  return result
}

/**
 * 갤러리 슬라이드형의 경우 사후 처리 필요
 * (다음 컴포넌트의 배경색이 결정된 후 갤러리 색상을 다시 설정)
 */
export function postProcessGalleryColors(
  components: string[],
  backgrounds: Record<string, BackgroundColor>,
  galleryType?: 'slide' | 'thumbnail'
): Record<string, BackgroundColor> {
  if (galleryType !== 'slide') return backgrounds

  const result = { ...backgrounds }

  for (let i = 0; i < components.length; i++) {
    if (components[i] === 'UnifiedGalleryComplete') {
      const nextComponent = i < components.length - 1 ? components[i + 1] : null

      if (nextComponent && result[nextComponent]) {
        // 다음 컴포넌트와 동일한 색상으로 설정
        result.UnifiedGalleryComplete = result[nextComponent]
      } else {
        // 다음 컴포넌트가 없으면 흰색
        result.UnifiedGalleryComplete = BACKGROUND_COLORS.WHITE
      }
      break
    }
  }

  return result
}
