# VPS 배포 (Docker)

## 1. 서버 준비

Linux VPS에 Docker와 Docker Compose가 설치되어 있어야 합니다.

```bash
# Ubuntu 예시
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# 재로그인 후
docker compose version
```

## 2. 프로젝트 업로드

로컬 PC에서 서버로 프로젝트 폴더를 복사합니다.

```powershell
# Windows (PowerShell) — 서버 IP와 경로를 본인 환경에 맞게 수정
scp -r "C:\Users\hamin\AI Project\youngeun-office" user@YOUR_SERVER_IP:/home/user/
```

또는 Git을 사용하는 경우:

```bash
git clone <저장소-url> youngeun-office
cd youngeun-office
```

## 3. 환경 변수 설정

서버에서 `.env` 파일을 만듭니다.

```bash
cd youngeun-office
cp .env.example .env
nano .env
```

필수 값:

```env
SESSION_SECRET="32자 이상 랜덤 문자열"
PORT=3000
```

`SESSION_SECRET` 예시 생성:

```bash
openssl rand -base64 32
```

## 4. 빌드 및 실행

```bash
docker compose up -d --build
```

로그 확인:

```bash
docker compose logs -f
```

## 5. 접속

- `http://서버IP:3000`
- 관리자: **Youngeun Admin** / PIN **0000**

## 6. 업데이트 (재배포)

```bash
cd youngeun-office
git pull   # 또는 scp로 파일 다시 복사
docker compose up -d --build
```

DB 데이터는 Docker volume `youngeun_data`에 보존됩니다.

## 7. (선택) Nginx + HTTPS

80/443 포트로 서비스하려면 Nginx 리버스 프록시를 앞에 둡니다.

```nginx
server {
    listen 80;
    server_name your-domain.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

## 문제 해결

| 증상 | 조치 |
|------|------|
| 컨테이너가 바로 종료됨 | `docker compose logs` 로 SESSION_SECRET 누락 확인 |
| DB 초기화 필요 | `docker compose down -v` 후 다시 `up` (데이터 삭제됨) |
| 포트 충돌 | `.env`에서 `PORT=8080` 등으로 변경 |
