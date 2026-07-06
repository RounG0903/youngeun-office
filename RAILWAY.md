# Railway 배포 가이드

Youngeun Office를 [Railway](https://railway.app)에 24시간 운영하는 방법입니다.

## 사전 준비

- [Railway](https://railway.app) 계정 (GitHub 로그인 권장)
- GitHub 저장소 (아래 1단계)
- 카드 등록 (무료 크레딧 후 사용량 과금)

---

## 1. GitHub에 코드 올리기

로컬에서 Git이 설치되어 있다면:

```powershell
cd "C:\Users\hamin\AI Project\youngeun-office"
git init
git add .
git commit -m "Prepare Railway deployment"
```

GitHub에서 새 저장소를 만든 뒤:

```powershell
git remote add origin https://github.com/YOUR_USER/youngeun-office.git
git branch -M main
git push -u origin main
```

---

## 2. Railway 프로젝트 생성

1. [railway.app/new](https://railway.app/new) 접속
2. **Deploy from GitHub repo** 선택
3. `youngeun-office` 저장소 연결 (처음이면 GitHub 권한 허용)
4. 저장소 선택 → 자동으로 Dockerfile 빌드 시작

---

## 3. 볼륨 추가 (SQLite 필수)

DB 파일이 재배포 후에도 유지되려면 **볼륨**이 필요합니다.

1. Railway 프로젝트 → **youngeun-office** 서비스 클릭
2. **Settings** 탭 → **Volumes**
3. **Add Volume** 클릭
4. 설정:
   - **Mount Path**: `/data`
5. 저장

---

## 4. 환경 변수 설정

서비스 → **Variables** 탭:

| 변수 | 값 |
|------|-----|
| `DATABASE_URL` | `file:/data/dev.db` |
| `SESSION_SECRET` | 32자 이상 랜덤 문자열 (아래 참고) |
| `NODE_ENV` | `production` |

`SESSION_SECRET` 생성 (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

SMS를 쓸 경우 (선택):

| 변수 | 값 |
|------|-----|
| `SMS_API_URL` | 문자 API URL |
| `SMS_API_KEY` | API 키 |

미설정 시 회원가입·계정찾기에서 개발 모드로 인증번호가 화면에 표시됩니다.

---

## 5. 도메인(공개 URL) 발급

1. 서비스 → **Settings** → **Networking**
2. **Generate Domain** 클릭
3. `https://youngeun-office-production-xxxx.up.railway.app` 형태 URL 생성

이 URL로 접속합니다.

---

## 6. 배포 확인

배포 로그에서 다음 메시지 확인:

```
Applying database schema...
Seeding database...
Starting Youngeun Office...
```

접속 테스트:

- 사이트: 발급된 Railway URL
- 관리자: **Youngeun Admin** / PIN **0000**

---

## 7. 코드 수정 후 재배포

GitHub `main` 브랜치에 push하면 Railway가 **자동 재배포**합니다.

```powershell
git add .
git commit -m "Update feature"
git push
```

볼륨(`/data`)의 DB는 유지됩니다.

---

## CLI로 배포 (선택)

```powershell
npm i -g @railway/cli
railway login
cd "C:\Users\hamin\AI Project\youngeun-office"
railway init
railway volume add --mount-path /data
railway variables set DATABASE_URL="file:/data/dev.db"
railway variables set SESSION_SECRET="your-secret-here"
railway up
```

---

## 예상 비용

- 트래픽·실행 시간에 따라 **월 $5 전후** (소규모 기준)
- Railway 대시보드 → **Usage**에서 확인

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| 배포는 되는데 502 | 로그 확인, `SESSION_SECRET` 설정 여부 |
| DB가 매번 초기화됨 | 볼륨 `/data` 마운트 확인 |
| 체크인/예약 오류 | Variables에 `DATABASE_URL=file:/data/dev.db` 확인 |
| 빌드 실패 | Railway 로그에서 `npm run build` 오류 확인 |

---

## 관리자 계정

| 항목 | 값 |
|------|-----|
| 이름 | Youngeun Admin |
| PIN | 0000 |

최초 배포 시 시드로 자동 생성됩니다.
