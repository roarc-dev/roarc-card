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
 * 회색 계열만 사용 (명도 차이를 명확하게)
 */
export const BACKGROUND_COLORS = {
  WHITE: '#ffffff',      // 명도 1.000
  LIGHT_GRAY: '#f5f5f5', // 명도 ~0.917
  MID_GRAY: '#ebebeb',   // 명도 ~0.846
  GRAY: '#e0e0e0',       // 명도 ~0.757
  DARK_GRAY: '#d0d0d0',  // 명도 ~0.655
} as const

export type BackgroundColor = typeof BACKGROUND_COLORS[keyof typeof BACKGROUND_COLORS]

/**
 * 동적 배경색 할당에 사용 가능한 색상 배열
 * (명도 순으로 정렬: 밝은 색 → 어두운 색)
 */
export const ASSIGNABLE_COLORS: BackgroundColor[] = [
  BACKGROUND_COLORS.WHITE,
  BACKGROUND_COLORS.LIGHT_GRAY,
  BACKGROUND_COLORS.MID_GRAY,
  BACKGROUND_COLORS.GRAY,
  BACKGROUND_COLORS.DARK_GRAY,
]

/**
 * 컴포넌트별 선호 배경색
 * 각 컴포넌트의 기존 배경색 또는 특성에 맞는 색상
 */
export const COMPONENT_PREFERRED_COLORS: Record<string, BackgroundColor> = {
  CalendarProxy: BACKGROUND_COLORS.LIGHT_GRAY,     // 기존 #f5f5f5
  UnifiedGalleryComplete: BACKGROUND_COLORS.WHITE, // 썸네일형은 흰색 선호로 변경 (캘린더와 차별화)
  Info: BACKGROUND_COLORS.MID_GRAY,                // 짙은 회색 선호 (흰색 카드)
  Account: BACKGROUND_COLORS.LIGHT_GRAY,           // 기존 #FAFAFA → #f5f5f5
  RSVPClient: BACKGROUND_COLORS.LIGHT_GRAY,        // 기존 #F5F5F5
  CommentBoard: BACKGROUND_COLORS.WHITE,           // 기존 #ffffff
  KakaoShare: BACKGROUND_COLORS.LIGHT_GRAY,        // 기존 #F5F5F5
  LocationUnified: BACKGROUND_COLORS.WHITE,        // 고정
}

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

  // 최소 5% 명도 차이 필요
  return contrast >= 0.05
}

/**
 * 인접 컴포넌트와 명도 차이가 충분한지 확인 (더 엄격한 기준)
 * @param color1 첫 번째 색상 (hex)
 * @param color2 두 번째 색상 (hex)
 * @returns 명도 차이가 최소 8% 이상이면 true
 */
function hasStrongContrast(color1: string, color2: string): boolean {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const contrast = Math.abs(lum1 - lum2)

  // 인접 컴포넌트는 최소 8% 명도 차이 필요 (시각적으로 더 명확한 차이)
  return contrast >= 0.08
}

/**
 * 배경색에 따라 적절한 버튼 색상 계산
 * @param backgroundColor 배경색 (hex)
 * @returns 버튼에 적합한 색상 (hex)
 */
export function getButtonColor(backgroundColor: string): string {
  const bgLuminance = getLuminance(backgroundColor)

  // 배경이 밝으면 버튼은 더 어둡게, 배경이 어두우면 버튼은 더 밝게
  // 하지만 검은색 텍스트가 있으므로 너무 어두워지면 안 됨

  if (bgLuminance > 0.9) {
    // 매우 밝은 배경 (WHITE): 중간 밝은 회색 버튼
    return '#ECECEC'
  } else if (bgLuminance > 0.85) {
    // 밝은 배경 (LIGHT_GRAY): 조금 더 어두운 버튼
    return '#e0e0e0'
  } else if (bgLuminance > 0.75) {
    // 중간 배경 (MID_GRAY): 밝은 버튼
    return '#f5f5f5'
  } else {
    // 어두운 배경 (GRAY, DARK_GRAY): 매우 밝은 버튼
    return '#fafafa'
  }
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

  console.log('[assignBackgroundColors] 시작:', { components, galleryType })

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
      console.log('[Gallery 처리]', {
        galleryType,
        prevComponent,
        prevColor: prevComponent ? result[prevComponent] : null,
        nextComponent,
        nextColor: nextComponent ? result[nextComponent] : null,
        preferredColor: COMPONENT_PREFERRED_COLORS[currentComponent]
      })

      if (galleryType === 'slide') {
        // 슬라이드형: 다음 컴포넌트와 동일한 색상
        if (nextComponent && result[nextComponent]) {
          result[currentComponent] = result[nextComponent]
          console.log('[Gallery] 슬라이드형 - 다음 컴포넌트 색상 사용:', result[currentComponent])
        } else {
          // 다음 컴포넌트가 아직 결정되지 않았으면 임시로 흰색
          result[currentComponent] = BACKGROUND_COLORS.WHITE
          console.log('[Gallery] 슬라이드형 - 임시 흰색 사용')
        }
      } else {
        // 썸네일형: 다음 컴포넌트와 다른 색상, 흰색 금지
        const nextColor = nextComponent ? result[nextComponent] : null
        const prevColor = prevComponent ? result[prevComponent] : null
        const preferredColor = COMPONENT_PREFERRED_COLORS[currentComponent]

        // 선호 배경색이 조건을 만족하는지 확인
        const canUsePreferred = preferredColor &&
          preferredColor !== BACKGROUND_COLORS.WHITE &&
          (!prevColor || (prevColor !== preferredColor && hasStrongContrast(preferredColor, prevColor))) &&
          (!nextColor || (nextColor !== preferredColor && hasStrongContrast(preferredColor, nextColor)))

        console.log('[Gallery] 썸네일형 선호색 체크:', {
          preferredColor,
          isWhite: preferredColor === BACKGROUND_COLORS.WHITE,
          prevColorCheck: !prevColor || (prevColor !== preferredColor && hasStrongContrast(preferredColor, prevColor)),
          nextColorCheck: !nextColor || (nextColor !== preferredColor && hasStrongContrast(preferredColor, nextColor)),
          canUsePreferred
        })

        if (canUsePreferred) {
          result[currentComponent] = preferredColor
          console.log('[Gallery] 썸네일형 - 선호색 사용:', preferredColor)
        } else {
          // 선호 배경색을 사용할 수 없으면 다른 색상 선택
          const availableColors = ASSIGNABLE_COLORS.filter(color => {
            if (color === BACKGROUND_COLORS.WHITE) return false // 흰색 금지
            if (nextColor && (color === nextColor || !hasStrongContrast(color, nextColor))) return false
            if (prevColor && (color === prevColor || !hasStrongContrast(color, prevColor))) return false
            return true
          })

          console.log('[Gallery] 썸네일형 - 사용 가능한 색상:', availableColors)
          result[currentComponent] = availableColors[0] || BACKGROUND_COLORS.LIGHT_GRAY
          console.log('[Gallery] 썸네일형 - 선택된 색상:', result[currentComponent])
        }
      }
      continue
    }

    // 3. Info 컴포넌트 (흰색 금지, 짙은 회색 선호)
    if (currentComponent === 'Info') {
      const prevColor = prevComponent ? result[prevComponent] : null
      const nextColor = nextComponent ? result[nextComponent] : null
      const preferredColor = COMPONENT_PREFERRED_COLORS[currentComponent]

      // 선호 배경색이 조건을 만족하는지 확인
      const canUsePreferred =
        preferredColor !== BACKGROUND_COLORS.WHITE &&
        (!prevColor || (prevColor !== preferredColor && hasStrongContrast(preferredColor, prevColor))) &&
        (!nextColor || (nextColor !== preferredColor && hasStrongContrast(preferredColor, nextColor)))

      if (canUsePreferred) {
        result[currentComponent] = preferredColor
        continue
      }

      // 선호 배경색을 사용할 수 없으면 다른 색상 선택
      const availableColors = ASSIGNABLE_COLORS.filter(color => {
        if (color === BACKGROUND_COLORS.WHITE) return false // 흰색 금지
        if (prevColor && (color === prevColor || !hasStrongContrast(color, prevColor))) return false
        if (nextColor && (color === nextColor || !hasStrongContrast(color, nextColor))) return false
        return true
      })

      result[currentComponent] = availableColors[0] || BACKGROUND_COLORS.MID_GRAY
      continue
    }

    // 4. 나머지 컴포넌트 (CalendarProxy, Account, RSVPClient, CommentBoard, KakaoShare)
    const prevColor = prevComponent ? result[prevComponent] : null
    const nextColor = nextComponent ? result[nextComponent] : null
    const buttonColor = BUTTON_COLORS[currentComponent]
    const preferredColor = COMPONENT_PREFERRED_COLORS[currentComponent]

    // 초대글 섹션(MainSection, InviteName) 바로 다음에 오는 컴포넌트인지 확인
    const isAfterInviteSection = prevComponent && (
      prevComponent === 'MainSection' ||
      prevComponent === 'InviteName' ||
      prevComponent === 'bgm'
    )

    // 선호 배경색이 조건을 만족하는지 확인
    const canUsePreferred = preferredColor &&
      !(isAfterInviteSection && preferredColor === BACKGROUND_COLORS.WHITE) &&
      (!prevColor || (prevColor !== preferredColor && hasStrongContrast(preferredColor, prevColor))) &&
      (!nextColor || (nextColor !== preferredColor && hasStrongContrast(preferredColor, nextColor))) &&
      (!buttonColor || hasGoodContrast(preferredColor, buttonColor))

    console.log(`[${currentComponent}] 처리:`, {
      prevComponent,
      prevColor,
      nextComponent,
      nextColor,
      preferredColor,
      canUsePreferred
    })

    if (canUsePreferred) {
      result[currentComponent] = preferredColor
      console.log(`[${currentComponent}] 선호색 사용:`, preferredColor)
      continue
    }

    // 선호 배경색을 사용할 수 없으면 다른 색상 선택
    const availableColors = ASSIGNABLE_COLORS.filter(color => {
      // 초대글 섹션 바로 다음에 오는 컴포넌트는 흰색 금지 (경계 명확화)
      if (isAfterInviteSection && color === BACKGROUND_COLORS.WHITE) {
        return false
      }

      // 이전/다음 컴포넌트와 명도 차이가 충분해야 함
      if (prevColor && (color === prevColor || !hasStrongContrast(color, prevColor))) return false
      if (nextColor && (color === nextColor || !hasStrongContrast(color, nextColor))) return false

      // 버튼 색상과 명도 차이가 충분해야 함
      if (buttonColor && !hasGoodContrast(color, buttonColor)) return false

      return true
    })

    console.log(`[${currentComponent}] 사용 가능한 색상:`, availableColors)
    // 사용 가능한 색상 중 첫 번째 선택
    result[currentComponent] = availableColors[0] || BACKGROUND_COLORS.LIGHT_GRAY
    console.log(`[${currentComponent}] 최종 선택:`, result[currentComponent])
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
