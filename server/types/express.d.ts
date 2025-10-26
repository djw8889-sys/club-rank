import "express";

declare global {
  namespace Express {
    interface Request {
      user?: any; // required → optional 로 변경
    }
  }
}

export {};
