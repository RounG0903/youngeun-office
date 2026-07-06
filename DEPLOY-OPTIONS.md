# 24시간 운영 방법 비교

Youngeun Office는 **SQLite**를 쓰므로, 데이터가 유지되는 **디스크(볼륨)** 가 있는 환경이 필요합니다.

| 방법 | 24시간 | 난이도 | 비용(대략) | 비고 |
|------|--------|--------|------------|------|
| **VPS + Docker** | ✅ | 중 | 월 5,000~20,000원 | [DEPLOY.md](./DEPLOY.md) |
| **Render** | ✅ (유료) | 쉬움 | 월 $7~ | `render.yaml` 포함 |
| **Railway** | ✅ | 쉬움 | 사용량 과금 | GitHub 연동 |
| **Fly.io** | ✅ | 중 | 소액~ | 볼륨 설정 필요 |
| **Oracle Cloud 무료 VM** | ✅ | 중 | **무료** | VPS와 동일하게 Docker |
| **Render 무료** | ❌ | 쉬움 | 무료 | 15분 미사용 시 슬립 |
| **Vercel** | △ | 쉬움 | 무료~ | SQLite 부적합, DB 변경 필요 |

---

## 1. Render (추천 — VPS 없이 가장 간단)

GitHub에 코드를 올린 뒤 Render에서 연결합니다.

1. [render.com](https://render.com) 가입
2. **New → Blueprint** → 이 저장소 연결
3. `render.yaml`이 자동 적용됨
4. **Starter 플랜** 이상 필요 (무료 플랜은 슬립되어 24시간 상시 운영 불가)
5. 배포 후 `https://youngeun-office.onrender.com` 형태 URL 제공

환경 변수 `SESSION_SECRET`은 Render가 자동 생성합니다. SMS를 쓰려면 대시보드에서 `SMS_API_URL`, `SMS_API_KEY` 추가.

---

## 2. Railway

1. [railway.app](https://railway.app) 가입 → **New Project → Deploy from GitHub**
2. 저장소 선택 (이 프로젝트)
3. **Settings → Volume** 추가
   - Mount path: `/data`
4. **Variables** 설정:
   ```
   DATABASE_URL=file:/data/dev.db
   SESSION_SECRET=<랜덤 32자 이상>
   ```
5. Dockerfile 자동 인식 후 배포

사용량에 따라 월 몇 달러 수준. 트래픽이 적으면 저렴합니다.

---

## 3. Oracle Cloud Always Free (무료 24시간 VPS)

카드 등록 필요하지만 **항상 무료** ARM VM 1대 제공.

1. [cloud.oracle.com](https://cloud.oracle.com) → VM 생성 (Ubuntu)
2. [DEPLOY.md](./DEPLOY.md)와 동일하게 Docker 설치 후 `docker compose up -d --build`

비용 없이 24시간 운영 가능. 설정은 VPS와 같습니다.

---

## 4. 집/사무실 PC 상시 실행 (비추천)

```powershell
cd "C:\Users\hamin\AI Project\youngeun-office"
npm run db:setup
npm run build
npm start
```

- PC를 **항상 켜 두어야** 함
- 정전·재부팅 시 서비스 중단
- 공유기 포트포워딩·보안 이슈

교육관 내부망 테스트용으로만 권장합니다.

---

## 어떤 걸 고를까?

- **가장 쉬움 (돈 조금 OK)** → **Render** (`render.yaml` 이미 준비됨)
- **가장 저렴하게 24시간** → **Oracle Cloud 무료 VM** + Docker
- **이미 VPS 있음** → [DEPLOY.md](./DEPLOY.md)

원하시는 플랫폼(Render / Railway / Oracle)을 말씀해 주시면 그 방법에 맞춰 단계별로 같이 진행할 수 있습니다.
