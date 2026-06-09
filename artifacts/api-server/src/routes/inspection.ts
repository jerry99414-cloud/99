import { Router, type IRouter } from "express";
import {
  computeUnInspected,
  generateInspectionDocx,
} from "../lib/inspection/generator";
import { INSPECTION_ITEMS } from "../lib/inspection/data";
import type { InspectionRequest } from "../lib/inspection/types";

const router: IRouter = Router();

router.get("/inspection/items", (_req, res) => {
  res.json({ items: INSPECTION_ITEMS });
});

router.post("/inspection/preview-uninspected", (req, res) => {
  const body = req.body as InspectionRequest;
  const summary = computeUnInspected(body);
  res.json(summary);
});

router.post("/inspection/generate", async (req, res, next) => {
  try {
    const body = req.body as InspectionRequest;
    if (!body || !body.projectName || !Array.isArray(body.days)) {
      res.status(400).json({ error: "Invalid request payload" });
      return;
    }
    const buffer = await generateInspectionDocx(body);
    const filename = encodeURIComponent(
      `${body.projectName}_機電消防公設檢驗時間表${body.isUnpublished ? "_未出刊版本" : ""}.docx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${filename}`,
    );
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "generate inspection failed");
    next(err);
  }
});

export default router;
