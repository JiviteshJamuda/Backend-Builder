import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import patientsRouter from "./patients";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";
import prescriptionsRouter from "./prescriptions";
import labTestsRouter from "./lab-tests";
import medicinesRouter from "./medicines";
import staffRouter from "./staff";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(patientsRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(prescriptionsRouter);
router.use(labTestsRouter);
router.use(medicinesRouter);
router.use(staffRouter);
router.use(dashboardRouter);

export default router;
