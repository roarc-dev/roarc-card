'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { PROXY_BASE_URL } from '@/lib/supabase'

// Typography 폰트 스택 (typography.js에서 가져온 값들)
const FONT_STACKS = {
    pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    p22: '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    goldenbook: '"goldenbook", "Goldenbook", serif',
    sloopScriptPro: '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif',
}

interface PageSettings {
    page_url?: string
    groom_name_kr?: string
    bride_name_kr?: string
    kko_img?: string
    kko_title?: string
    kko_date?: string
    photo_section_image_url?: string
    wedding_date?: string
    wedding_hour?: string
    wedding_minute?: string
    kakao_template_id?: string | number
    template_id?: string | number
}

interface InviteData {
    groomName?: string
    brideName?: string
}

async function fetchPageSettings(pageId: string): Promise<PageSettings | null> {
    if (!pageId) return null
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
        )
        if (!res.ok) return null
        const json: unknown = await res.json()
        if (
            typeof json === 'object' &&
            json !== null &&
            'success' in json &&
            'data' in json
        ) {
            const typed = json as { success?: boolean; data?: PageSettings }
            if (typed?.success && typed?.data) return typed.data
        }
    } catch (error) {
        console.error('카카오 공유 설정 로딩 실패', error)
    }
    return null
}

async function fetchInviteData(pageId: string): Promise<InviteData | null> {
    if (!pageId) return null
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(pageId)}`
        )
        if (!res.ok) return null
        const json: unknown = await res.json()
        if (
            typeof json === 'object' &&
            json !== null &&
            'success' in json &&
            'data' in json
        ) {
            const typed = json as {
                success?: boolean
                data?: { groom_name?: string; bride_name?: string }
            }
            if (typed?.success && typed?.data) {
                const data = typed.data
                return {
                    groomName: data.groom_name || '',
                    brideName: data.bride_name || '',
                }
            }
        }
    } catch (error) {
        console.error('초대장 데이터 로딩 실패', error)
    }
    return null
}

function formatWeddingDate(weddingDate?: string): string {
    if (!weddingDate) return ''
    try {
        // "2025-12-06" 형태를 "251206"으로 변환
        const date = new Date(weddingDate)
        const year = date.getFullYear().toString().slice(-2) // 마지막 2자리
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}${month}${day}`
    } catch {
        return ''
    }
}

function formatWeddingDateTime(settings: PageSettings): string {
    const { wedding_date, wedding_hour, wedding_minute } = settings

    if (!wedding_date) return '결혼식 정보를 확인해 주세요'

    try {
        const date = new Date(wedding_date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // 요일 계산
        const dayNames = [
            '일요일',
            '월요일',
            '화요일',
            '수요일',
            '목요일',
            '금요일',
            '토요일',
        ]
        const dayOfWeek = dayNames[date.getDay()]

        // 시간 포맷팅 (12시간제)
        const hour = wedding_hour ? parseInt(wedding_hour) : null
        const minute = wedding_minute ? parseInt(wedding_minute) : null

        let timeText = ''
        if (hour !== null) {
            const period = hour >= 12 ? '오후' : '오전'
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
            timeText = `${period} ${displayHour}시`
            if (minute && minute > 0) {
                timeText += ` ${minute.toString().padStart(2, '0')}분`
            }
        }

        return `${year}년 ${month}월 ${day}일 ${dayOfWeek}${
            timeText ? ` ${timeText}` : ''
        }`.trim()
    } catch {
        return '결혼식 정보를 확인해 주세요'
    }
}

interface KakaoShareProps {
    pageId?: string
    userUrl?: string
    style?: React.CSSProperties
}

declare global {
    interface Window {
        Kakao?: {
            isInitialized: () => boolean
            Share: {
                sendCustom: (options: {
                    templateId: number
                    templateArgs: Record<string, string>
                }) => void
            }
        }
    }
}

export default function KakaoShare(props: KakaoShareProps) {
    const { pageId = '', userUrl = '', style } = props

    // 즉시 로그 출력 (렌더링 시점)
    console.log('🔵 [KakaoShare] 컴포넌트 렌더링 시작')
    console.error('🔴 [KakaoShare] ERROR 레벨 로그 테스트 - 컴포넌트 렌더링됨')
    console.warn('🟡 [KakaoShare] WARN 레벨 로그 테스트 - props:', { pageId, userUrl })

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [inviteData, setInviteData] = useState<InviteData | null>(null)
    const [kakaoReady, setKakaoReady] = useState(false)

    // Typography 폰트 로딩 - 페이지 레벨에서 처리됨

    // 폰트 패밀리 설정 (typography.js에서 가져온 폰트 스택 사용)
    const pretendardFontFamily = FONT_STACKS.pretendardVariable

    // 컴포넌트 마운트 확인
    useEffect(() => {
        console.log('🔵 [KakaoShare] ===== useEffect 실행됨 =====')
        console.error('🔴 [KakaoShare] ERROR 레벨 - useEffect 실행')
        console.warn('🟡 [KakaoShare] WARN 레벨 - props:', { pageId, userUrl })
        console.log('[KakaoShare] window.Kakao 존재:', typeof window !== 'undefined' && !!(window as any).Kakao)
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const kakao = (window as any).Kakao
            console.log('[KakaoShare] Kakao 객체:', kakao)
            console.log('[KakaoShare] Kakao.isInitialized 함수:', typeof kakao.isInitialized)
            if (typeof kakao.isInitialized === 'function') {
                console.log('[KakaoShare] Kakao.isInitialized() 결과:', kakao.isInitialized())
            }
        }
    }, [])

    useEffect(() => {
        console.log('[KakaoShare] 데이터 로딩 시작, pageId:', pageId)
        if (!pageId) {
            console.warn('[KakaoShare] pageId가 없어서 데이터 로딩 중단')
            setSettings(null)
            setInviteData(null)
            return
        }
        let cancelled = false

        // page-settings 데이터 가져오기
        void fetchPageSettings(pageId).then((data) => {
            console.log('[KakaoShare] page-settings 로드 완료:', data ? '성공' : '실패', data)
            if (!cancelled) setSettings(data)
        }).catch((error) => {
            console.error('[KakaoShare] page-settings 로드 실패:', error)
        })

        // invite 데이터 가져오기
        void fetchInviteData(pageId).then((data) => {
            console.log('[KakaoShare] invite 데이터 로드 완료:', data ? '성공' : '실패', data)
            if (!cancelled) setInviteData(data)
        }).catch((error) => {
            console.error('[KakaoShare] invite 데이터 로드 실패:', error)
        })

        return () => {
            cancelled = true
        }
    }, [pageId])

    // 카카오 SDK 초기화 확인
    useEffect(() => {
        const checkKakaoReady = () => {
            if (typeof window !== 'undefined' && (window as any).Kakao) {
                const kakao = (window as any).Kakao
                console.log('[KakaoShare] Kakao 객체 존재:', !!kakao)
                console.log('[KakaoShare] Kakao.isInitialized 함수 존재:', typeof kakao.isInitialized === 'function')
                if (kakao.isInitialized && kakao.isInitialized()) {
                    console.log('[KakaoShare] Kakao SDK 초기화 완료')
                    setKakaoReady(true)
                    return
                } else {
                    console.log('[KakaoShare] Kakao SDK 초기화 안됨')
                }
            } else {
                console.log('[KakaoShare] window.Kakao 없음')
            }
            setKakaoReady(false)
        }

        // 초기 체크
        checkKakaoReady()

        // 주기적으로 체크 (SDK 로드 대기)
        const interval = setInterval(checkKakaoReady, 100)

        // 최대 5초 대기
        const timeout = setTimeout(() => {
            clearInterval(interval)
            checkKakaoReady()
            console.log('[KakaoShare] SDK 로드 대기 완료 (5초)')
        }, 5000)

        return () => {
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [])

    const templateArgs = useMemo(() => {
        console.log('[KakaoShare] templateArgs 계산 시작, settings:', settings)
        if (!settings) {
            console.log('[KakaoShare] templateArgs: settings가 없어서 null 반환')
            return null
        }

        // 신랑/신부 이름: inviteData 우선, 없으면 page_settings에서 가져옴
        const groomName =
            inviteData?.groomName?.trim() || settings.groom_name_kr?.trim() || ''
        const brideName =
            inviteData?.brideName?.trim() || settings.bride_name_kr?.trim() || ''

        // Admin.tsx에서 이미 포맷팅된 정보를 그대로 사용
        const customTitle =
            settings.kko_title?.trim() || `${groomName} ♥ ${brideName} 결혼합니다`

        const customBody =
            settings.kko_date?.trim() || formatWeddingDateTime(settings)

        // 이미지 URL: kko_img 우선, 없으면 메인 사진 사용
        // 주의: photo_section_image_url은 AVIF일 수 있어 카카오톡에서 미지원
        // AVIF URL 감지하여 경고 로그 출력
        let imageUrl = settings.kko_img?.trim() || ''
        if (!imageUrl && settings.photo_section_image_url) {
            const photoUrl = settings.photo_section_image_url
            if (photoUrl.includes('.avif') || photoUrl.includes('/avif')) {
                console.warn(
                    '[KakaoShare] 카카오톡 공유용 이미지를 별도로 업로드해주세요.'
                )
            }
            imageUrl = photoUrl
        }

        // 카카오 템플릿에서 ${REGI_WEB_DOMAIN}/${WEDDING_URL} 형태로 사용
        // REGI_WEB_DOMAIN: "https://mcard.roarc.kr/"
        // WEDDING_URL: 날짜/page_id 형태 (예: "251206/wedding-demo")
        const formattedDate = formatWeddingDate(settings.wedding_date)
        const publicSlug = (userUrl || pageId).trim()
        const pathWithDate = formattedDate ? `${formattedDate}/${publicSlug}` : publicSlug

        const args = {
            WEDDING_IMAGE: imageUrl,
            CUSTOM_TITLE: customTitle,
            CUSTOM_BODY: customBody,
            WEDDING_URL: pathWithDate, // 날짜/page_id 형태 전달
        }
        console.log('[KakaoShare] templateArgs 계산 완료:', args)
        return args
    }, [settings, inviteData, pageId, userUrl])

    // 템플릿 ID 고정값
    const templateId = "124666"

    const kakao = typeof window !== 'undefined' ? window.Kakao : undefined

    // 디버깅: isReadyToShare 조건 체크
    useEffect(() => {
        console.log('[KakaoShare] isReadyToShare 조건 체크:', {
            templateId: !!templateId,
            templateIdValue: templateId,
            pageId: !!pageId,
            pageIdValue: pageId,
            templateArgs: !!templateArgs,
            templateArgsValue: templateArgs,
            kakao: !!kakao,
            kakaoReady,
            kakaoInitialized: kakao?.isInitialized ? kakao.isInitialized() : false,
        })
    }, [templateId, pageId, templateArgs, kakao, kakaoReady])

    const isReadyToShare =
        !!templateId &&
        !!pageId &&
        !!templateArgs &&
        !!kakao &&
        kakaoReady &&
        kakao.isInitialized()

    const handleShare = () => {
        console.error('🔴 [KakaoShare] 버튼 클릭됨!')
        console.log('[KakaoShare] handleShare 호출, isReadyToShare:', isReadyToShare)
        console.log('[KakaoShare] templateArgs:', templateArgs)
        console.log('[KakaoShare] kakao:', kakao)
        
        if (!isReadyToShare || !templateArgs) {
            console.error('🔴 [KakaoShare] 공유 불가 - 조건 미충족')
            console.log('[KakaoShare] 조건 체크:', {
                isReadyToShare,
                hasTemplateArgs: !!templateArgs,
                hasKakao: !!kakao,
                kakaoReady,
                kakaoInitialized: kakao?.isInitialized ? kakao.isInitialized() : false,
            })
            alert('카카오톡 공유를 위해 필요한 설정이 준비되지 않았습니다.')
            return
        }

        try {
            console.log('[KakaoShare] 카카오톡 공유 시도')
            kakao!.Share.sendCustom({
                templateId: Number(templateId),
                templateArgs,
            })
            console.log('[KakaoShare] 카카오톡 공유 성공')
        } catch (error) {
            console.error('🔴 [KakaoShare] 카카오톡 공유 실패', error)
            alert('카카오톡 공유 중 오류가 발생했습니다.')
        }
    }

    // 렌더링 시점 로그
    console.log('🔵 [KakaoShare] 렌더링 중, isReadyToShare:', isReadyToShare)
    console.error('🔴 [KakaoShare] ERROR 레벨 - 렌더링 중')

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            color: 'rgba(245, 245, 245, 1)',
            backgroundColor: '#FAFAFA',
            paddingTop: 40,
            ...(style || {})
        }}>
            <button
                type="button"
                onClick={handleShare}
                disabled={!isReadyToShare}
                onMouseEnter={() => console.log('[KakaoShare] 버튼 마우스 오버')}
                style={{
                    width: '60%',
                    height: '100%',
                    minWidth: 160,
                    minHeight: 54,
                    border: 'none',
                    backgroundColor: '#e0e0e0',
                    color: '#000',
                    fontFamily: pretendardFontFamily,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isReadyToShare ? 'pointer' : 'not-allowed',
                    opacity: isReadyToShare ? 1 : 0.6,
                }}
            >
                카카오톡으로 공유하기 {!isReadyToShare && '(비활성화)'}
            </button>
        </div>
    )
}

