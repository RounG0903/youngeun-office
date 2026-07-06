# Youngeun Office

교육관 회의실 예약 프로그램

## 계정 유형 및 접근 권한

| 역할 | 가입 방법 | 접근 화면 |
|------|-----------|-----------|
| **USER** | 회원가입 (휴대폰 인증) | `/reservations`, `/history`, `/account` |
| **TABLET** | 관리자 등록 | `/tablet` |
| **ADMIN** | DB 시드 / 관리자 지정 | `/admin` |

로그인 시 이름과 PIN으로 인증하며, 계정 역할에 따라 자동으로 해당 화면으로 이동합니다.

## 기능

### 사용자 (USER)
- 회원가입 (휴대폰 문자 인증, 이름, PIN) — 전화번호당 계정 1개
- 계정 찾기 (`/find-account`) — 휴대폰 인증 후 이름·PIN 조회
- 회의실 예약 · 취소 · 히스토리
- PIN 변경 (`/account`)
- 현장 태블릿 QR 스캔 체크인

### 관리자 (ADMIN)
- 회원 / 태블릿 계정 / 회의실 / 예약 관리
- 회원별 체크인 필요 여부 설정 (면제 시 노쇼 패널티 없음)
- 태블릿 계정 PIN 확인 및 변경
- 관리자 PIN 변경 (`/admin/settings`)
- 관리자·태블릿 계정은 회원 관리에 미노출, 패널티 미적용

### 태블릿 (TABLET)
- 체크인 QR · 사이트 안내 QR 노출
- 로그아웃 시 PIN 확인 필요

## 시작하기

```bash
cd "C:\Users\hamin\AI Project\youngeun-office"
npm install
npm run db:push
npm run db:seed
npm run dev
```

### 관리자 계정 (시드)

| 항목 | 값 |
|------|-----|
| 이름 | Youngeun Admin |
| PIN | 0000 |

### 태블릿 계정

관리자 화면 → **태블릿 계정**에서 회의실별로 생성합니다.

| 항목 | 값 |
|------|-----|
| 로그인 아이디 | 회의실명 (예: 회의실 A) |
| 초기 PIN | 0000 |

### SMS 인증 (회원가입)

`.env`에 `SMS_API_URL`, `SMS_API_KEY`를 설정하면 실제 문자가 발송됩니다.  
미설정 시 개발 모드로 인증번호가 화면에 표시됩니다.

## DB 스키마 변경 시

```bash
npm run db:push
npm run db:seed
```

데이터 충돌 시 `prisma/dev.db`를 삭제한 뒤 위 명령을 다시 실행하세요.

## 서버 배포

| 문서 | 내용 |
|------|------|
| [DEPLOY.md](./DEPLOY.md) | VPS + Docker |
| [DEPLOY-OPTIONS.md](./DEPLOY-OPTIONS.md) | Render, Railway, Oracle 무료 등 비교 |
| [RAILWAY.md](./RAILWAY.md) | **Railway 배포** (단계별 가이드) |
