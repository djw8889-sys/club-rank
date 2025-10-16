// fixPaths.js
// ✅ 자동 수정 스크립트: import.meta.dirname → __dirname
// Replit / Vite 환경에서 ESM 경로 문제를 한 번에 해결합니다.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 현재 디렉토리 기준 탐색
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 수정할 대상 파일 목록
const targetFiles = [
  "vite.config.ts",
  "index.ts",
  "server.ts",
  "vite.ts",
].filter((f) => fs.existsSync(path.resolve(__dirname, f)));

for (const file of targetFiles) {
  const filePath = path.resolve(__dirname, file);
  let code = fs.readFileSync(filePath, "utf-8");

  // 이미 수정된 파일은 건너뜀
  if (code.includes("fileURLToPath(import.meta.url)")) {
    console.log(`✅ [${file}] 이미 수정되어 있습니다.`);
    continue;
  }

  // 상단에 __dirname 초기화 코드 삽입
  const importIndex = code.indexOf("import");
  const firstBreak = code.indexOf("\n", importIndex);
  const before = code.slice(0, firstBreak + 1);
  const after = code.slice(firstBreak + 1);

  const addCode = `
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
`;

  code = before + addCode + after;

  // import.meta.dirname → __dirname 으로 교체
  code = code.replaceAll("import.meta.dirname", "__dirname");

  // 변경 내용 저장
  fs.writeFileSync(filePath, code, "utf-8");
  console.log(`🔧 수정 완료: ${file}`);
}

console.log("\n✨ 모든 파일 수정 완료!");
console.log("👉 이제 다음 명령으로 테스트하세요:");
console.log("   npm run build && npm start\n");
