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

export default router;import { Router, type IRouter } from "express";
import healthRouter from "./health";
import citiesRouter from "./cities";
import commentsRouter from "./comments";
import newsRouter from "./news";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(citiesRouter);
router.use(commentsRouter);
router.use(newsRouter);
router.use(adminRouter);

export default router;
