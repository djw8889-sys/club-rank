# 🚀 ClubRank Railway 배포 가이드

이 가이드는 ClubRank 앱을 Railway에 자동 배포하는 방법을 안내합니다.

## 📋 사전 준비

### 1. Firebase 프로젝트 설정
Firebase Console에서 필요한 정보를 준비합니다:
- Firebase API Key
- Project ID
- App ID
- Service Account JSON (Firebase Admin용)

### 2. GitHub 저장소 생성
```bash
# Git이 이미 초기화되어 있으므로, 원격 저장소만 연결
git remote add origin https://github.com/YOUR_USERNAME/club-rank.git
git branch -M main
git add .
git commit -m "initial railway deployment setup"
git push -u origin main
```

**⚠️ 중요**: `.env` 파일은 `.gitignore`에 포함되어 있어 GitHub에 푸시되지 않습니다.

---

## 🚂 Railway 배포 단계

### 1️⃣ Railway 계정 생성
1. [Railway](https://railway.app) 접속
2. "Login with GitHub" 클릭하여 GitHub 계정으로 로그인

### 2️⃣ 새 프로젝트 생성
1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `club-rank` 저장소 선택

### 3️⃣ 환경변수 설정
Railway 프로젝트 설정에서 "Variables" 탭으로 이동하여 다음 환경변수를 추가합니다:

#### Frontend 환경변수:
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Backend 환경변수:
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} 
```
*(전체 Service Account JSON을 한 줄로 붙여넣기)*

#### Server 환경변수:
```
PORT=5000
NODE_ENV=production
```

### 4️⃣ 배포 설정 확인
Railway는 자동으로 다음을 실행합니다:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

추가 설정이 필요 없습니다! `package.json`의 스크립트가 자동으로 인식됩니다.

### 5️⃣ 배포 시작
1. Railway가 자동으로 배포를 시작합니다
2. "Deployments" 탭에서 빌드 로그 확인
3. 성공하면 Railway가 생성한 URL 확인 (예: `https://club-rank.up.railway.app`)

---

## ✅ 배포 확인

### 앱 테스트:
1. Railway URL 접속
2. 로그인 화면 확인
3. Google 로그인 테스트
4. 클럽 기능 정상 작동 확인

### Health Check:
```bash
curl https://your-railway-url.railway.app/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "firebase": {
    "firestore": "connected"
  }
}
```

---

## 🔄 자동 재배포

### Replit에서 코드 수정 후:
```bash
git add .
git commit -m "update feature"
git push origin main
```

Railway는 `main` 브랜치에 푸시될 때마다 **자동으로 재배포**합니다.

---

## 🐛 문제 해결

### 배포 실패 시:
1. Railway "Logs" 탭에서 오류 확인
2. 환경변수가 올바르게 설정되었는지 확인
3. `package.json`의 scripts 확인

### Firebase 연결 오류:
- `FIREBASE_SERVICE_ACCOUNT`가 올바른 JSON 형식인지 확인
- Firebase Console에서 Service Account 권한 확인

### 빌드 오류:
```bash
# 로컬에서 빌드 테스트
npm run build
npm start
```

---

## 📊 Railway 리소스

### 무료 플랜:
- 월 500시간 실행 시간
- 512MB RAM
- 1GB 디스크

### 프로 플랜 ($5/월):
- 무제한 실행 시간
- 8GB RAM
- 100GB 디스크

---

## 🎉 완료!

ClubRank 앱이 Railway에 성공적으로 배포되었습니다!

**배포 URL**: `https://your-app.up.railway.app`

Firebase, 클럽 기능, 랭킹 시스템 모두 정상 작동합니다.
