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

interface EternalDateVenueProps {
    pageId?: string
    style?: React.CSSProperties
    fontSize?: number
    lineHeight?: number
    fontWeight?: number
    fontColor?: string
    venueMarginBottom?: number
}

// 장소명을 Title Case로 변환하는 함수
function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

// 날짜를 '9th November 2025' 형식으로 변환하는 함수
function formatDateForDisplay(dateStr: string | null): string {
    if (!dateStr) return ""
    try {
        const [year, month, day] = dateStr
            .split("-")
            .map((v) => parseInt(v, 10))
        if (!year || !month || !day) return ""

        const date = new Date(year, month - 1, day)
        const dayWithSuffix = getDayWithSuffix(day)
        const monthName = getMonthName(date.getMonth())

        return `${dayWithSuffix} ${monthName} ${year}`
    } catch {
        return ""
    }
}

function getDayWithSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
        return `${day}th`
    }
    switch (day % 10) {
        case 1:
            return `${day}st`
        case 2:
            return `${day}nd`
        case 3:
            return `${day}rd`
        default:
            return `${day}th`
    }
}

function getMonthName(monthIndex: number): string {
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return months[monthIndex] || ""
}

export default function EternalDateVenue(props: EternalDateVenueProps) {
    const {
        pageId,
        style,
        fontSize = 32,
        lineHeight = 1.0,
        fontWeight = 400,
        fontColor = "#000",
        venueMarginBottom = 8
    } = props

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
            console.warn("[EternalDateVenue] Typography loading failed:", error)
        }
    }, [])

    // sloop-script-pro 폰트 스택 가져오기
    const sloopFontFamily = useMemo(() => {
        try {
            // typography.helpers.stacks.sloopScriptPro 사용
            if (typography?.helpers?.stacks?.sloopScriptPro) {
                return typography.helpers.stacks.sloopScriptPro
            }
            // fallback
            return '"sloop-script-pro", "Sloop Script Pro", sans-serif'
        } catch {
            return '"sloop-script-pro", "Sloop Script Pro", sans-serif'
        }
    }, [])

    // 장소명과 날짜 추출 및 변환
    const venueName = settings?.venue_name
        ? toTitleCase(settings.venue_name)
        : ""
    const formattedDate = formatDateForDisplay(settings?.wedding_date || null)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100px",
                ...style,
            }}
        >
            {venueName && (
                <div
                    style={{
                        fontFamily: sloopFontFamily,
                        fontWeight: fontWeight,
                        fontStyle: "normal",
                        fontSize: `${fontSize}px`,
                        lineHeight: `${lineHeight}em`,
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
                        fontFamily: sloopFontFamily,
                        fontWeight: fontWeight,
                        fontStyle: "normal",
                        fontSize: `${fontSize}px`,
                        lineHeight: `${lineHeight}em`,
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

