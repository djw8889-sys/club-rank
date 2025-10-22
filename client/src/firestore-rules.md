# Firebase Firestore Security Rules

아래 규칙을 Firebase Console > Firestore Database > Rules에 추가해야 합니다:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - Users can only update their own document, except for admin-only fields
    match /users/{userId} {
      allow read: if true; // Anyone can read user profiles (needed for player matching)
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId 
        && !isAdminOnlyField(request.resource.data, resource.data);
      allow delete: if false; // Users cannot be deleted
    }
    
    // Admin-only user operations
    match /users/{userId} {
      // Only admins can update points, role, and other admin fields
      allow update: if request.auth != null 
        && isAdmin(request.auth.uid)
        && isAdminOnlyUpdate(request.resource.data, resource.data);
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true; // Anyone can read posts
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.authorId || isAdmin(request.auth.uid));
      allow delete: if request.auth != null 
        && (request.auth.uid == resource.data.authorId || isAdmin(request.auth.uid));
    }
    
    // Matches collection
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && (request.auth.uid == resource.data.requesterId 
            || request.auth.uid == resource.data.targetId 
            || isAdmin(request.auth.uid));
      allow delete: if isAdmin(request.auth.uid);
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // Chats are immutable
      allow delete: if isAdmin(request.auth.uid);
    }
    
    // Helper functions
    function isAdmin(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role == 'admin';
    }
    
    function isAdminOnlyField(newData, oldData) {
      return newData.keys().hasAny(['role', 'points']) && 
        (newData.role != oldData.role || newData.points != oldData.points);
    }
    
    function isAdminOnlyUpdate(newData, oldData) {
      return newData.keys().hasAny(['role', 'points']);
    }
  }
}
```

## 보안 규칙 설명

### 사용자 관리
- ✅ 모든 사용자가 프로필 읽기 가능 (매치 찾기용)
- ✅ 사용자는 본인 문서만 생성/수정 가능
- ❌ `role`, `points` 같은 관리자 전용 필드는 일반 사용자 수정 불가
- ✅ 관리자만 다른 사용자의 포인트와 역할 수정 가능

### 게시글 관리
- ✅ 작성자 또는 관리자만 게시글 수정/삭제 가능

### 매치 관리
- ✅ 매치 참여자 또는 관리자만 매치 상태 수정 가능

이 규칙들은 클라이언트 측 검증을 우회하려는 시도를 서버에서 차단합니다.