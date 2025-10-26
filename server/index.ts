import express from "express";
import cors from "cors";
import { admin } from "./firebase-admin";
import routes from "./routes";

const app = express();
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get("/", (_, res) => res.send("✅ Match Point Server is running"));

// 실제 API
app.use("/api", routes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
