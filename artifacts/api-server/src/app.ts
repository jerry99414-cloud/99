import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Render 上 dist/index.mjs 位置在 artifacts/api-server/dist
// 前端 build 後位置在 artifacts/inspection-schedule/dist
const frontendDistPath = path.resolve(__dirname, "../../inspection-schedule/dist");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// 提供前端靜態檔
app.use(express.static(frontendDistPath));

// React SPA fallback
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

export default app;