import express from "express";
import morgan from 'morgan'
const app = express()
app.use(morgan("dev"));
import bcrypt from "bcryptjs"
import mysql from 'mysql'
import { pool } from "../database/db.js";
import { connection } from "../app.js";
import { Server } from "socket.io";
import { io } from "../app.js";


export const loadContrat = async (req,res)=>{
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos` WHERE contratista_asignado = ? ', [req.session.c_identidad], async (error, results, fields)=>{
        if (req.session.loggedin) {
            if( results != undefined){
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat[0])
                    console.log(req.session.loggedin)
                    await res.render('contratos',{
                        login: true,
                        name: req.session.name,
                        rol: req.session.rol,
                        sexo: req.session.sexo,
                        contratos: contrat
                    }
                );
                
                } else {
                    console.log('no hay datos') 
                                    
                }
                 }else{
                    console.log(req.session.loggedin)
                    await res.redirect('/');
                }
    })

}