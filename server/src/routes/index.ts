import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import homeRouter from "./home";
import walletRouter from "./wallet";
import wishlistRouter from "./wishlist";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import couponsRouter from "./coupons";
import chatRouter from "./chat";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(homeRouter);
router.use(walletRouter);
router.use(wishlistRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(couponsRouter);
router.use(chatRouter);
router.use(uploadRouter);

export default router;
