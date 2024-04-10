import { Router } from "express";
import {
    loginContratMethod,
    logout,
    registerMethod,
    loginAdminMethod,
    loginAuth,
    loginView,
    registerUser,
    loginAdminView,
    reqContratos,
} from '../controllers/Controller.js'
const router = Router();

router.get('/index', loginAuth, reqContratos);
router.get('/', loginView);
router.post('/', loginContratMethod);
router.get('/admin', loginAdminView)
router.post('/admin', loginAdminMethod)
router.get("/register", registerUser);
router.post("/register", registerMethod);
router.get ('/logout', logout)

export default router;
