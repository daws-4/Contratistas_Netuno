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
    deleteContrat,
    loginEditContratistaAuth,
    loadContratista,
    deleteContratista,
    updateContratista,
    updateContratistaMethod,
    contratosPendientes,
    contratosEmitidos,
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
router.get ('/delete-contrato/:id', deleteContrat)
router.get('/contratista', loginEditContratistaAuth)
router.get('/contratista/:id', loadContratista)
router.get('/update-contratista/:id', updateContratista)
router.post('/update-contratista/:id', updateContratistaMethod)
router.get('/delete-contratista/:id', deleteContratista)
router.get('/contratos-pendientes', contratosPendientes)
router.get ('/archivo-de-contratos', contratosEmitidos)


export default router;
