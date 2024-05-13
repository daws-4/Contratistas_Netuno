import { Router } from "express";
import express from "express";
import { fileURLToPath } from "url";
import multer from "multer";
import { dirname, join,extname } from "path";

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
    loginContratistaAuth,
    loadContratista,
    deleteContratista,
    updateContratista,
    updateContratistaMethod,
    contratosPendientes,
    contratosEmitidos,
    uploadContratMethodXML,
    jsonrender,
    filtroContratos,
    FinishContrat,
    filtroContratistas
} from '../controllers/Controller.js'
const router = Router();

router.get('/index', loginAuth, );
router.post('/index', filtroContratos)
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
router.get ('/finish-contrato/:id', FinishContrat)
router.get('/contratista', loginContratistaAuth)
router.post('/contratista', filtroContratistas)
router.get('/contratista/:id', loadContratista)
router.get('/update-contratista/:id', updateContratista)
router.post('/update-contratista/:id', updateContratistaMethod)
router.get('/delete-contratista/:id', deleteContratista)
router.get('/contratos-pendientes', contratosPendientes)
router.get ('/archivo-de-contratos', contratosEmitidos)
router.post ('/upload-contrato/json', uploadContratMethodXML,  jsonrender )


export default router;
