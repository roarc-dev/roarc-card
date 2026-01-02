'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { PROXY_BASE_URL } from '@/lib/supabase'

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
const KAKAO_APP_KEY =
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY || 'db63a9b37174b5a425a21d797318dff8'

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

// 카카오 SDK 타입 정의 수정
declare global {
    interface Window {
        Kakao?: {
            init: (key: string) => void
            // isInitialized는 실제로 존재하지 않음
            Share?: {
                sendCustom: (options: {
                    templateId: number
                    templateArgs: Record<string, string>
                }) => void
            }
            // 내부적으로 초기화 여부를 확인하는 비공개 속성
            _initializedAppKey?: string
        }
    }
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
        const date = new Date(weddingDate)
        const year = date.getFullYear().toString().slice(-2)
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

export default function KakaoShare(props: KakaoShareProps) {
    const { pageId = '', userUrl = '', style } = props

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [inviteData, setInviteData] = useState<InviteData | null>(null)
    const [kakaoReady, setKakaoReady] = useState(false)

    const pretendardFontFamily = FONT_STACKS.pretendardVariable

    // 데이터 로딩
    useEffect(() => {
        console.log('[KakaoShare] 데이터 로딩 시작, pageId:', pageId)
        if (!pageId) {
            setSettings(null)
            setInviteData(null)
            return
        }
        let cancelled = false

        void fetchPageSettings(pageId).then((data) => {
            console.log('[KakaoShare] page-settings 로드 완료:', data)
            if (!cancelled) setSettings(data)
        })

        void fetchInviteData(pageId).then((data) => {
            console.log('[KakaoShare] invite 데이터 로드 완료:', data)
            if (!cancelled) setInviteData(data)
        })

        return () => {
            cancelled = true
        }
    }, [pageId])

    // 카카오 SDK 로드 및 초기화 (개선된 버전)
    useEffect(() => {
        if (typeof window === 'undefined') return

        console.log('[KakaoShare] SDK 초기화 시작')

        // SDK가 이미 로드되어 있는지 확인
        const checkAndInitialize = () => {
            const kakao = window.Kakao
            if (!kakao) {
                console.log('[KakaoShare] Kakao SDK 없음')
                return false
            }

            // Kakao SDK는 중복 init 호출 시 경고만 발생하고 정상 작동
            // isInitialized 메서드는 실제로 존재하지 않음
            try {
                // _initializedAppKey는 내부 속성으로 초기화 여부 확인 가능
                if (!kakao._initializedAppKey) {
                    console.log('[KakaoShare] SDK 초기화 시도')
                    kakao.init(KAKAO_APP_KEY)
                } else {
                    console.log('[KakaoShare] SDK 이미 초기화됨')
                }

                if (!kakao.Share) {
                    console.warn('[KakaoShare] Kakao.Share 모듈 없음')
                    return false
                }

                console.log('[KakaoShare] SDK 준비 완료')
                setKakaoReady(true)
                return true
            } catch (error) {
                console.error('[KakaoShare] SDK 초기화 실패:', error)
                setKakaoReady(false)
                return false
            }
        }

        // 즉시 확인 (이미 로드된 경우)
        if (checkAndInitialize()) {
            return
        }

        // 스크립트 로드 필요
        const scriptSelector = `script[src="${KAKAO_SDK_URL}"]`
        let script = document.querySelector<HTMLScriptElement>(scriptSelector)

        const handleLoad = () => {
            console.log('[KakaoShare] SDK 스크립트 로드 완료')
            // 약간의 지연 후 초기화 (SDK가 완전히 준비되도록)
            setTimeout(() => {
                checkAndInitialize()
            }, 100)
        }

        const handleError = (event: Event) => {
            console.error('[KakaoShare] SDK 스크립트 로드 실패', event)
            setKakaoReady(false)
        }

        if (script) {
            // 스크립트가 이미 있는 경우
            if (script.complete) {
                // 이미 로드 완료
                handleLoad()
            } else {
                // 로드 중
                script.addEventListener('load', handleLoad)
                script.addEventListener('error', handleError)
            }
        } else {
            // 새 스크립트 생성
            script = document.createElement('script')
            script.src = KAKAO_SDK_URL
            script.async = true
            script.crossOrigin = 'anonymous'
            script.integrity =
                'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka'
            script.addEventListener('load', handleLoad)
            script.addEventListener('error', handleError)
            document.head.appendChild(script)
        }

        return () => {
            script?.removeEventListener('load', handleLoad)
            script?.removeEventListener('error', handleError)
        }
    }, [])

    const templateArgs = useMemo(() => {
        if (!settings) return null

        const groomName =
            inviteData?.groomName?.trim() || settings.groom_name_kr?.trim() || ''
        const brideName =
            inviteData?.brideName?.trim() || settings.bride_name_kr?.trim() || ''

        const customTitle =
            settings.kko_title?.trim() || `${groomName} ♥ ${brideName} 결혼합니다`

        const customBody =
            settings.kko_date?.trim() || formatWeddingDateTime(settings)

        let imageUrl = settings.kko_img?.trim() || ''
        if (!imageUrl && settings.photo_section_image_url) {
            const photoUrl = settings.photo_section_image_url
            if (photoUrl.includes('.avif') || photoUrl.includes('/avif')) {
                console.warn(
                    '[KakaoShare] AVIF 이미지는 카카오톡에서 지원되지 않을 수 있습니다.'
                )
            }
            imageUrl = photoUrl
        }

        const formattedDate = formatWeddingDate(settings.wedding_date)
        const publicSlug = (userUrl || pageId).trim()
        const pathWithDate = formattedDate ? `${formattedDate}/${publicSlug}` : publicSlug

        const args = {
            WEDDING_IMAGE: imageUrl,
            CUSTOM_TITLE: customTitle,
            CUSTOM_BODY: customBody,
            WEDDING_URL: pathWithDate,
        }
        console.log('[KakaoShare] templateArgs:', args)
        return args
    }, [settings, inviteData, pageId, userUrl])

    const templateId = "124666"

    const isReadyToShare = useMemo(() => {
        const ready = !!(
            kakaoReady &&
            templateId &&
            pageId &&
            templateArgs &&
            window.Kakao?.Share
        )
        console.log('[KakaoShare] isReadyToShare:', ready, {
            kakaoReady,
            hasTemplateId: !!templateId,
            hasPageId: !!pageId,
            hasTemplateArgs: !!templateArgs,
            hasKakaoShare: !!window.Kakao?.Share,
        })
        return ready
    }, [kakaoReady, templateId, pageId, templateArgs])

    const handleShare = () => {
        console.log('[KakaoShare] 공유 버튼 클릭')

        if (!isReadyToShare) {
            alert('카카오톡 공유 준비 중입니다. 잠시 후 다시 시도해주세요.')
            return
        }

        const kakao = window.Kakao
        if (!kakao?.Share || !templateArgs) {
            console.error('[KakaoShare] SDK 또는 데이터 누락')
            alert('카카오톡 공유를 준비할 수 없습니다. 페이지를 새로고침해주세요.')
            return
        }

        try {
            console.log('[KakaoShare] sendCustom 호출:', {
                templateId: Number(templateId),
                templateArgs,
            })

            kakao.Share.sendCustom({
                templateId: Number(templateId),
                templateArgs: templateArgs,
            })

            console.log('[KakaoShare] 공유 성공')
        } catch (error) {
            console.error('[KakaoShare] 공유 실패:', error)
            alert(
                `카카오톡 공유 중 오류가 발생했습니다.\n${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    return (
        <div 
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                color: 'rgba(245, 245, 245, 1)',
                backgroundColor: '#FAFAFA',
                paddingTop: 40,
                paddingBottom: 40,
                ...(style || {})
            }}
        >
            <button
                type="button"
                onClick={handleShare}
                disabled={!isReadyToShare}
                style={{
                    width: '60%',
                    minWidth: 160,
                    height: 54,
                    border: 'none',
                    backgroundColor: isReadyToShare ? '#FEE500' : '#e0e0e0',
                    color: isReadyToShare ? '#000' : '#999',
                    fontFamily: pretendardFontFamily,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isReadyToShare ? 'pointer' : 'not-allowed',
                    opacity: isReadyToShare ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                }}
            >
                {isReadyToShare ? '카카오톡으로 공유하기' : '카카오톡 공유 준비 중...'}
            </button>
        </div>
    )
}