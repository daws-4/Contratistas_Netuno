import { Router } from "express";
import {
    loginAuth,
    loginMethod,
    loginView,
    logout,
    registerMethod,
    registerUser,
} from '../controllers/Controller.js'
const router = Router();

router.get('/index',  loginAuth );
router.get('/', loginView);
router.post('/', loginMethod);
router.get("/register", registerUser);
router.post("/register", registerMethod);
router.get ('/logout', logout)

export default router;
