// server/types/express.d.ts
import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: any; // 또는 실제 사용자 타입으로 변경
  }
}
