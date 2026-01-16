'use client'

import React, { useEffect, useMemo } from "react"
// @ts-ignore
import typography from "@/lib/typography.js"
import { usePageSettings } from '@/lib/hooks/usePageSettings'

interface PageSettings {
    page_id: string
    groom_name_kr?: string
    groom_name_en?: string
    bride_name_kr?: string
    bride_name_en?: string
    wedding_date?: string | null
    wedding_hour?: string | null
    wedding_minute?: string | null
    venue_name?: string | null
    venue_address?: string | null
    photo_section_image_url?: string | null
    photo_section_image_path?: string | null
    photo_section_overlay_position?: "top" | "bottom" | null
    photo_section_overlay_color?: "#ffffff" | "#000000" | null
    photo_section_locale?: "en" | "kr" | null
    updated_at?: string | null
}

interface FioreDateVenueProps {
    pageId?: string
    style?: React.CSSProperties
    fontColor?: string
    venueMarginBottom?: number
}

// 날짜를 '2026. 1. 18. SAT. 12:30 PM' 형식으로 변환하는 함수
function formatDateForDisplay(
    dateStr: string | null,
    hour: string | null,
    minute: string | null
): string {
    if (!dateStr) return ""
    try {
        const [year, month, day] = dateStr
            .split("-")
            .map((v) => parseInt(v, 10))
        if (!year || !month || !day) return ""

        const date = new Date(year, month - 1, day)
        const dayOfWeek = getDayOfWeek(date.getDay())

        // 시간 포맷팅
        let timeStr = ""
        if (hour !== null && minute !== null) {
            const hourNum = parseInt(hour, 10)
            const minuteNum = parseInt(minute, 10)
            if (!isNaN(hourNum) && !isNaN(minuteNum)) {
                const period = hourNum >= 12 ? "PM" : "AM"
                const displayHour =
                    hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
                const displayMinute = minuteNum.toString().padStart(2, "0")
                timeStr = ` ${displayHour}:${displayMinute} ${period}`
            }
        }

        return `${year}. ${month}. ${day}. ${dayOfWeek}.${timeStr}`
    } catch {
        return ""
    }
}

function getDayOfWeek(dayIndex: number): string {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    return days[dayIndex] || ""
}

export default function FioreDateVenue(props: FioreDateVenueProps) {
    const { pageId, style, fontColor = "#000", venueMarginBottom = 8 } = props

    // SWR로 페이지 설정 가져오기
    const { pageSettings } = usePageSettings(pageId)

    // pageSettings를 settings로 변환
    const settings = useMemo(() => {
        if (!pageSettings) return null
        const data = pageSettings as any
        return {
            page_id: data.page_id || data.id,
            groom_name_kr: data.groom_name_kr || data.groom_name,
            groom_name_en: data.groom_name_en,
            bride_name_kr: data.bride_name_kr || data.bride_name,
            bride_name_en: data.bride_name_en,
            wedding_date: data.wedding_date,
            wedding_hour: data.wedding_hour,
            wedding_minute: data.wedding_minute,
            venue_name: data.venue_name,
            venue_address: data.venue_address,
            photo_section_image_url: data.photo_section_image_url,
            photo_section_image_path: data.photo_section_image_path,
            photo_section_overlay_position: data.photo_section_overlay_position,
            photo_section_overlay_color: data.photo_section_overlay_color,
            photo_section_locale: data.photo_section_locale,
            updated_at: data.updated_at,
        } as PageSettings
    }, [pageSettings])

    // Typography 폰트 로딩 (Typekit 포함)
    useEffect(() => {
        try {
            if (typography && typeof typography.ensure === "function") {
                // typography.ensure()는 Pretendard, P22, 그리고 Typekit(Goldenbook, Sloop Script Pro)을 모두 로드합니다
                typography.ensure()
            }
        } catch (error) {
            console.warn("[FioreDateVenue] Typography loading failed:", error)
        }
    }, [])

    // P22 폰트 스택 가져오기
    const p22FontFamily = useMemo(() => {
        try {
            return (
                typography?.helpers?.stacks?.p22 ||
                '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
            )
        } catch {
            return '"P22 Late November", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Apple Color Emoji", "Segoe UI Emoji"'
        }
    }, [])

    // 장소명과 날짜 추출 및 변환
    const venueName = settings?.venue_name
        ? settings.venue_name.toUpperCase()
        : ""
    const formattedDate = formatDateForDisplay(
        settings?.wedding_date || null,
        settings?.wedding_hour || null,
        settings?.wedding_minute || null
    )

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            {venueName && (
                <div
                    style={{
                        fontFamily: p22FontFamily,
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "16px",
                        letterSpacing: "0em",
                        color: fontColor,
                        marginBottom: `${venueMarginBottom}px`,
                        textAlign: "center",
                    }}
                >
                    {venueName}
                </div>
            )}
            {formattedDate && (
                <div
                    style={{
                        fontFamily: p22FontFamily,
                        fontWeight: 400,
                        fontStyle: "normal",
                        fontSize: "16px",
                        letterSpacing: "0em",
                        color: fontColor,
                        textAlign: "center",
                    }}
                >
                    {formattedDate}
                </div>
            )}
        </div>
    )
}

