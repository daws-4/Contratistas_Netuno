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
    loadContrat,
    uploadContrat,
    uploadContratMethod,
    updateContrat,
    updateContratMethod,
} from '../controllers/Controller.js'
const router = Router();

router.get('/index', loginAuth, );
router.get('/', loginView);
router.post('/', loginContratMethod);
router.get('/admin', loginAdminView)
router.post('/admin', loginAdminMethod)
router.get("/register", registerUser);
router.post("/register", registerMethod);
router.get ('/logout', logout)
router.get('/contratos/:id', loadContrat)
router.get('/upload-contrato', uploadContrat)
router.post('/upload-contrato', uploadContratMethod)
router.get('/update-contrato/:id', updateContrat)
router.post('/update-contrato/:id', updateContratMethod)

export default router;
