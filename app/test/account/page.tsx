'use client'

import AccountBtn from '@/components/wedding/Account'

export default function TestAccountPage() {
  // 테스트용 pageId (실제 계좌 정보가 있는 pageId로 변경 가능)
  const testPageId = 'taehohoho'

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '430px',
        backgroundColor: '#FAFAFA',
      }}
    >
      <div
        style={{
          maxWidth: 400,
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: 8,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 20,
            textAlign: 'center',
            paddingTop: 20,
          }}
        >
          Account 컴포넌트 테스트
        </h1>
        <div style={{ marginBottom: 20, fontSize: 14, color: '#666', padding: '0 20px' }}>
          <p>Page ID: {testPageId}</p>
          <p style={{ marginTop: 8 }}>
            실제 계좌 정보가 있는 pageId로 변경하여 테스트하세요.
          </p>
        </div>
        <AccountBtn pageId={testPageId} />
      </div>
    </div>
  )
}

