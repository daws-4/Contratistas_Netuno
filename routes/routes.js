import { Router } from "express";
import {
    loginViewAdmin,
    loginAuth,
    loginContratMethod,
    loginView,
    logout,
    registerMethod,
    registerUser,
    loginAdminMethod,
} from '../controllers/Controller.js'
const router = Router();

router.get('/index',  loginAuth );
router.get('/', loginView);
router.post('/', loginContratMethod);
router.get('/admin', loginViewAdmin)
router.post('/admin', loginAdminMethod)
router.get("/register", registerUser);
router.post("/register", registerMethod);
router.get ('/logout', logout)

export default router;
