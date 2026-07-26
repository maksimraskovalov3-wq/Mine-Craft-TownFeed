import { Router } from "express";
import healthRouter from "./health.js";
import citiesRouter from "./cities.js";
import commentsRouter from "./comments.js";
import newsRouter from "./news.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use(citiesRouter);
router.use(commentsRouter);
router.use(newsRouter);
router.use(adminRouter);

export default router;
