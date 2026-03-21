import { Router, NextFunction, Request, Response } from "express";
import httpErrors from "http-errors";
import { ValidationError } from "sequelize";

import { authRouter } from "@web-speed-hackathon-2026/server/src/routes/api/auth";
import { crokRouter } from "@web-speed-hackathon-2026/server/src/routes/api/crok";
import { directMessageRouter } from "@web-speed-hackathon-2026/server/src/routes/api/direct_message";
import { imageRouter } from "@web-speed-hackathon-2026/server/src/routes/api/image";
import { initializeRouter } from "@web-speed-hackathon-2026/server/src/routes/api/initialize";
import { movieRouter } from "@web-speed-hackathon-2026/server/src/routes/api/movie";
import { postRouter } from "@web-speed-hackathon-2026/server/src/routes/api/post";
import { searchRouter } from "@web-speed-hackathon-2026/server/src/routes/api/search";
import { soundRouter } from "@web-speed-hackathon-2026/server/src/routes/api/sound";
import { userRouter } from "@web-speed-hackathon-2026/server/src/routes/api/user";

export const apiRouter = Router();
const CACHEABLE_POSTS_PATH_PATTERN = /^\/posts(\/[^/]+(\/comments)?)?$/;
const CACHEABLE_USER_PATH_PATTERN = /^\/users\/[^/]+(\/posts)?$/;
const POSTS_CACHE_CONTROL = "public, max-age=60";
const DEFAULT_PUBLIC_CACHE_CONTROL = "public, max-age=86400";

apiRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  return next();
});

apiRouter.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  if (
    CACHEABLE_POSTS_PATH_PATTERN.test(req.path)
  ) {
    res.setHeader("Cache-Control", POSTS_CACHE_CONTROL);
    return next();
  }

  if (
    CACHEABLE_USER_PATH_PATTERN.test(req.path) ||
    req.path === "/search" ||
    req.path === "/search/sentiment" ||
    req.path === "/crok/suggestions"
  ) {
    res.setHeader("Cache-Control", DEFAULT_PUBLIC_CACHE_CONTROL);
  }

  return next();
});

apiRouter.use(initializeRouter);
apiRouter.use(userRouter);
apiRouter.use(postRouter);
apiRouter.use(directMessageRouter);
apiRouter.use(searchRouter);
apiRouter.use(movieRouter);
apiRouter.use(imageRouter);
apiRouter.use(soundRouter);
apiRouter.use(authRouter);
apiRouter.use(crokRouter);

apiRouter.use(async (err: Error, _req: Request, _res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) {
    throw new httpErrors.BadRequest();
  }
  throw err;
});

apiRouter.use(async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (!httpErrors.isHttpError(err) || err.status === 500) {
    console.error(err);
  }

  return res
    .status(httpErrors.isHttpError(err) ? err.status : 500)
    .type("application/json")
    .send({
      message: err.message,
    });
});
