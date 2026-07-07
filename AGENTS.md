# Agent Instructions

## Cursor Cloud specific instructions

### Development

- Node.js 20+, npm
- Copy `.env.example` to `.env` if missing
- `npm install` then `npm run db:setup` for local SQLite
- Dev server: `npm run dev` (port 3000)
- Seeded admin: **Youngeun Admin** / PIN **0000**
- SMS unset → verification codes shown in dev mode

### Deployment (Railway)

**변경 사항은 항상 즉시 프로덕션 서버에 배포합니다.**

1. 작업 완료 후 `main` 브랜치에 커밋·푸시합니다.
2. Railway는 `main` push 시 자동 재배포합니다 (GitHub 연동).
3. 배포 확인: `./scripts/deploy.sh` 또는 GitHub Deployments API로 success 상태 확인.
4. 기능 브랜치를 쓴 경우 PR 생성 후 **즉시 `main`에 머지**하고 푸시합니다.

배포 전 `npm run build`로 빌드가 통과하는지 확인합니다.
