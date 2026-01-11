'use client'

import { useState } from 'react'
import UnifiedGalleryComplete from '@/components/wedding/UnifiedGalleryComplete'

export default function GalleryTestPage() {
    const [galleryType, setGalleryType] = useState<'thumbnail' | 'slide'>('thumbnail')
    const [galleryZoom, setGalleryZoom] = useState(true)

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
            {/* 컨트롤 패널 */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>갤러리 타입:</label>
                    <select 
                        value={galleryType} 
                        onChange={(e) => setGalleryType(e.target.value as 'thumbnail' | 'slide')}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            fontSize: '14px'
                        }}
                    >
                        <option value="thumbnail">썸네일형</option>
                        <option value="slide">슬라이드형</option>
                    </select>
                </div>
                
                <div>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>핀치줌:</label>
                    <button
                        onClick={() => setGalleryZoom(!galleryZoom)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            backgroundColor: galleryZoom ? '#10b981' : '#ef4444',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        {galleryZoom ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div style={{ fontSize: '14px', color: '#666' }}>
                    현재: {galleryType === 'thumbnail' ? '썸네일형' : '슬라이드형'} | 
                    핀치줌 {galleryZoom ? '활성화' : '비활성화'}
                </div>
            </div>

            {/* 갤러리 영역 */}
            <div style={{ paddingTop: '100px' }}>
                <GalleryTestComponent 
                    key={`${galleryType}-${galleryZoom}`}
                    galleryType={galleryType}
                    galleryZoom={galleryZoom}
                />
            </div>
        </div>
    )
}

function GalleryTestComponent({ 
    galleryType, 
    galleryZoom 
}: { 
    galleryType: 'thumbnail' | 'slide'
    galleryZoom: boolean
}) {
    // 테스트용 더미 이미지 데이터
    const dummyImages = [
        {
            id: '1',
            src: 'https://cdn.roarc.kr/data/roarc_SEO_basic.jpg',
            alt: 'Test Image 1',
            public_url: 'https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'
        },
        {
            id: '2',
            src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
            alt: 'Test Image 2',
            public_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
        },
        {
            id: '3',
            src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
            alt: 'Test Image 3',
            public_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800'
        },
        {
            id: '4',
            src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
            alt: 'Test Image 4',
            public_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800'
        }
    ]

    // UnifiedGalleryComplete에 props 주입하기 위한 wrapper
    // 실제로는 API에서 데이터를 가져오지만, 테스트를 위해 직접 주입
    return (
        <div style={{
            backgroundColor: '#fafafa',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '430px',
                margin: '0 auto',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    marginBottom: '20px',
                    color: '#333'
                }}>
                    {galleryType === 'thumbnail' ? '썸네일형' : '슬라이드형'} 갤러리
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#666',
                    marginBottom: '20px',
                    fontSize: '14px'
                }}>
                    핀치줌: {galleryZoom ? '✅ 활성화' : '❌ 비활성화'}<br/>
                    {galleryZoom && '이미지를 핀치하여 확대/축소해보세요'}
                </p>
                
                {/* 실제 갤러리 컴포넌트 - pageId를 통해 간접적으로 설정 전달 */}
                <UnifiedGalleryComplete 
                    pageId={galleryType === 'slide' ? 'test' : 'default'}
                />
                
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#0369a1'
                }}>
                    <strong>테스트 방법:</strong><br/>
                    • 모바일 기기에서 테스트하거나<br/>
                    • Chrome DevTools의 Device Mode 사용<br/>
                    • 핀치줌 ON일 때 이미지를 확대해보세요<br/>
                    • GALLERY 제목과 썸네일은 확대되지 않아야 합니다
                </div>
            </div>
        </div>
    )
}

