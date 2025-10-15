# 🐙 GitHub 저장소 연결 가이드

ClubRank 프로젝트를 GitHub에 연결하고 Railway 자동 배포를 설정하는 단계별 가이드입니다.

## 📋 1단계: GitHub 저장소 생성

### GitHub 웹사이트에서:
1. [GitHub](https://github.com) 로그인
2. 우측 상단 `+` 버튼 → `New repository` 클릭
3. 저장소 이름: `club-rank`
4. Description: "ClubRank - Tennis Club Management Platform"
5. **Public** 또는 **Private** 선택
6. ⚠️ **중요**: "Add a README file" 체크 **해제** (이미 코드가 있으므로)
7. "Create repository" 클릭

---

## 🔗 2단계: 원격 저장소 연결

GitHub에서 생성한 저장소 URL을 복사하고, Replit Shell에서 다음 명령어를 실행합니다:

```bash
# 원격 저장소 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/club-rank.git

# 원격 저장소 확인
git remote -v
```

예상 출력:
```
origin  https://github.com/YOUR_USERNAME/club-rank.git (fetch)
origin  https://github.com/YOUR_USERNAME/club-rank.git (push)
```

---

## 📤 3단계: GitHub에 푸시

```bash
# 현재 변경사항 확인
git status

# 모든 파일 스테이징
git add .

# 커밋 생성
git commit -m "Initial Railway deployment setup"

# main 브랜치로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

### GitHub 인증 요청 시:
- **Username**: GitHub 사용자명 입력
- **Password**: GitHub Personal Access Token 입력 (비밀번호가 아닙니다!)

### Personal Access Token 생성 방법:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. Note: "ClubRank deployment"
4. Expiration: 90 days 또는 No expiration
5. Scopes: `repo` 체크
6. "Generate token" 클릭
7. **토큰을 안전한 곳에 복사** (다시 볼 수 없습니다!)

---

## ✅ 4단계: 푸시 확인

GitHub 저장소 페이지를 새로고침하여 다음 파일들이 업로드되었는지 확인:

### 필수 파일:
- ✅ `package.json` - 의존성 및 스크립트
- ✅ `railway.json` - Railway 배포 설정
- ✅ `.env.example` - 환경변수 템플릿
- ✅ `DEPLOYMENT.md` - Railway 배포 가이드
- ✅ `server/` - 백엔드 코드
- ✅ `client/` - 프론트엔드 코드

### 제외된 파일 (보안):
- ❌ `.env` - 환경변수 (`.gitignore`에 포함)
- ❌ `node_modules/` - 의존성 (`.gitignore`에 포함)
- ❌ `dist/` - 빌드 파일 (`.gitignore`에 포함)

⚠️ **중요**: `.env` 파일이 GitHub에 푸시되지 않았는지 반드시 확인하세요!

---

## 🔄 5단계: 이후 업데이트 방법

코드 수정 후 GitHub에 푸시:

```bash
# 변경사항 스테이징
git add .

# 커밋
git commit -m "설명적인 커밋 메시지"

# 푸시
git push origin main
```

Railway는 `main` 브랜치에 푸시될 때마다 자동으로 재배포합니다!

---

## 🚂 다음 단계

GitHub 푸시가 완료되었다면:
1. `DEPLOYMENT.md` 파일을 열어 Railway 배포 가이드 확인
2. Railway 배포 진행

---

## 🐛 문제 해결

### "remote: Repository not found" 오류:
- GitHub 저장소 이름이 올바른지 확인
- GitHub 저장소가 실제로 생성되었는지 확인
- 원격 URL 다시 설정: `git remote set-url origin https://github.com/USERNAME/club-rank.git`

### "Permission denied" 오류:
- GitHub Personal Access Token 생성 및 사용
- Token에 `repo` 권한이 있는지 확인

### ".env 파일이 푸시되었어요":
```bash
# .env 파일을 git에서 제거 (파일은 유지)
git rm --cached .env

# 다시 커밋
git commit -m "Remove .env from git"
git push origin main
```

---

## 📊 완료 체크리스트

- [ ] GitHub 저장소 생성
- [ ] 원격 저장소 연결
- [ ] GitHub에 푸시 성공
- [ ] `.env` 파일이 푸시되지 않음 확인
- [ ] 모든 필수 파일이 GitHub에 있음 확인

✅ 모두 완료되었다면 `DEPLOYMENT.md`를 참고하여 Railway 배포를 진행하세요!
