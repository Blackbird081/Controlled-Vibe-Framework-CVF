// src/server/health.controller.ts

import { Request, Response } from "express";

export function healthCheck(req: Request, res: Response) {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString()
  });
}
