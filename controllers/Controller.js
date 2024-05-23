import express from "express";
import morgan from 'morgan'
const app = express()
app.use(morgan("dev"));
import bcrypt from "bcryptjs"
import multer from "multer";
import { connection } from "../app.js";
import xml2js from 'xml2js'
import fs, { rmSync } from 'node:fs'
import formidable from "formidable";
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';


const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(CURRENT_DIR,'../')
const MIMETYPES = ['text/xml'];

const multerUpload = multer({
    storage: multer.diskStorage({
        destination: join(CURRENT_DIR, '../uploads'),
        filename: (req, file, cb) => {
            const fileExtension = extname(file.originalname);
            const fileName = file.originalname.split(fileExtension)[0];

            cb(null, `${fileName}-${Date.now()}${fileExtension}`);
        },
    }),
    fileFilter: (req, file, cb) => {
        if (MIMETYPES.includes(file.mimetype)) cb(null, true);
        else cb(new Error(`Only ${MIMETYPES.join(' ')} mimetypes are allowed`));
    },
    limits: {
        fieldSize: 100000000,
    }, 
});

// Metodo de incio de sesión
export const loginContratMethod = async (req, res)=> {
const email = req.body.email;
const password = req.body.password;
let passwordHash = await bcrypt.hash(password, 8);
if (email && password) {
    connection.query('SELECT * FROM contratistas WHERE email = ?', [email], async (error, results, fields)=> {
        if( results.length == 0 || !( await bcrypt.compare(password, results[0].contraseña)) ) {    
            res.render('login', {
                    login: false,
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "USUARIO y/o CONTRASEÑA incorrectos",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: '',
                    ruta: ''    
                });
            
            //Mensaje simple y poco vistoso
            //res.send('Incorrect Username and/or Password!');				
        } else {         
            //creamos una var de session y le asignamos true si INICIO SESSION       
            req.session.loggedin = true;                
            req.session.name = results[0].Nombres;
            req.session.rol = results[0].rol
            req.session.sexo = results[0].sexo
            req.session.c_identidad = results[0].C_Identidad
            req.session.empresa_contratista = results[0].empresa
            console.log(req.session.loggedin, req.session.name, req.session.rol, req.session.c_identidad, req.session.empresa_contratista)
            res.render('login', {
                login:false,
                alert: true,
                alertTitle: "Conexión exitosa",
                alertMessage: "¡LOGIN CORRECTO!",
                alertIcon:'success',
                showConfirmButton: '',
                timer: 1500,
                ruta: 'index'
            });        			
        }			
        res.end();
    });
} else {	
    res.send('Please enter user and Password!');
    res.end();
}
};
// Método de inicio de sesión para administradores
export const loginAdminMethod = async (req, res)=> {
    const email = req.body.email;
    const password = req.body.password;    
    let passwordHash = await bcrypt.hash(password, 8);
    if (email && password) {
        connection.query('SELECT * FROM administradores WHERE email = ?', [email], async (error, results, fields)=> {
            if( results.length == 0 || !( await bcrypt.compare(password, results[0].contraseña)) ) {    
                res.render('login', {
                        login: false,
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "USUARIO y/o CONTRASEÑA incorrectos",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: '',
                        ruta: '',
                    });
                
                //Mensaje simple y poco vistoso
                //res.send('Incorrect Username and/or Password!');				
            } else {         
                console.log(results[0])
                // console.log('cagaste')
                //creamos una var de session y le asignamos true si INICIO SESSION       
                req.session.loggedin = true            
                req.session.name = results[0].Nombres
                req.session.rol = results[0].rol
                req.session.email = results[0].email
                req.session.sexo = results [0].sexo
                req.session.empresa_contratista = results[0].contratista
                res.render('login', {
                    login: false,
                    alert: true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "¡LOGIN CORRECTO!",
                    alertIcon:'success',
                    showConfirmButton: '',
                    timer: 1500,
                    ruta: 'index',
                });        			
            }			
            res.end();
        });
    } else {	
        res.send('Please enter user and Password!');
        res.end();
    }
    };
    
//Métodos para controlar auth - para renderizar las páginas, lista de contratos y de contratistas
export const loginAuth = async (req, res, next)=> {
    if(req.session.loggedin){

    if(req.session.rol == 2){

        //renderizar contratos para administradores
        connection.query('SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo`, empresa_contratista FROM `contratos` ORDER BY fecha_contrato ASC', async (error, results, fields)=>{


            connection.query('SELECT * FROM contratistas', async (error,results,fields)=>{
                let contratistas = results
                console.log(contratistas)
            })
           
            if (req.session.loggedin) {
                if( results != undefined){

                
                        let contrat = [results]
                        console.log(contrat[0])
                        await res.render('index',{
                            estatus: false,
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

             //Renderizar estadísticas del sistema



            }else if (req.session.rol == 1){
                //renderizar contratos para administradores contratistas
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos WHERE empresa_contratista = ${req.session.empresa_contratista} ORDER BY fecha_contrato ASC `, async (error, results, fields)=>{
            if (req.session.loggedin) {
                if( results != undefined){
                        req.dashboard = results[0]
                        let contrat = [results]
                        console.log (contrat[0])
                        console.log(req.session.loggedin, req.session.empresa_contratista)
                        await res.render('index',{
                            estatus: false,
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

    //renderizar contratos para contratistas
    }else if (req.session.rol == 0){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo FROM contratos WHERE contratista_asignado = ${req.session.c_identidad} AND empresa_contratista =${req.session.empresa_contratista} ORDER BY fecha_contrato ASC`, async (error, results, fields)=>{
        if( error){
                console.log(error)
            
            } else {
                req.dashboard = results[0]
                let contrat = [results]
                console.log (req.session.c_identidad, contrat[0])
                console.log(req.session.loggedin)
                console.log('cagaste')
                await res.render('index',{
                    estatus: false,
                    login: true,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratos: contrat
                }
            );
                				
            }
            
     })
    }    
}else{
    console.log(req.session.loggedin)
    await res.redirect('/');
}
};

export const loginContratistaAuth = async (req, res, next)=> {

    if(req.session.loggedin){
        if (req.session.rol == 2) {
        //renderizar contratos para administradores
        connection.query('SELECT * FROM `contratistas`', async (error, results, fields)=>{
            for (let index = 0; index < results.length; index++) {
                var id_contratista = results
               
                console.log(results[index].C_Identidad)
            }
            console.log(id_contratista.C_Identidad)
            console.log(id_contratista.length)

           

           
            for (let index = 0; index < id_contratista.length; index++) {

                 //Actualizar datos 
                connection.query(`SELECT c.estatus_, c.id, c.empresa_contratista, c.contratista_asignado, DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, ct.C_Identidad, ct.empresa FROM contratos AS c INNER JOIN contratistas AS ct ON c.contratista_asignado = ct.C_Identidad WHERE c.contratista_asignado = ${id_contratista[index].C_Identidad}`, async (error, results) =>{
                    if(error){
                console.log(error)
                    }else{
                 let stats =results
           

            // console.log(stats)

                let agendados = results.filter(result => result.estatus_ === 0)
                let instalados = results.filter(result => result.estatus_ === 1)
                console.log(`cantidad de contratos agendados del usuario  ${id_contratista[index].C_Identidad}  es ${agendados.length}`)
                console.log(`cantidad de contratos instalados del usuario  ${id_contratista[index].C_Identidad}  es ${instalados.length}`)

                connection.query(`UPDATE contratistas SET contratos_pendientes = ${agendados.length},
                 contratos_instalados = ${instalados.length}
                  WHERE C_Identidad = ${id_contratista[index].C_Identidad}`, async (error, results)=>{
                    if(error){
                        console.log(error)
                    }else{
                        console.log(results)
                    }

                    }) 
                    }
            })
            }
           
                if( results != undefined){
                        let contrat = [results]
                        await res.render('contratistas_listview',{
                            estatus_: '',
                            login: true,
                            name: req.session.name,
                            rol: req.session.rol,
                            sexo: req.session.sexo,
                            contratistas: contrat

                        }
                    );
                    } else {
                        console.log('no hay datos') 
                                        
                    }
                })
                    }else if (req.session.loggedin == 1){


                        connection.query('SELECT * FROM `contratistas` WHERE empresa = ?' ,[req.session.empresa_contratista], async (error, results, fields)=>{
           
                            if( results != undefined){
                                    let contrat = [results]
                                    console.log (contrat[0])
                                    console.log(req.session.loggedin)
                                    await res.render('contratistas_listview',{
                                        estatus_: '',
                                        login: true,
                                        name: req.session.name,
                                        rol: req.session.rol,
                                        sexo: req.session.sexo,
                                        contratistas: contrat
            
                                    }
                                );
                                } else {
                                    console.log('no hay datos') 
                                                    
                                }
                            })

                     }else{
                        console.log(req.session.loggedin)
                        await res.redirect('/index');
                    }
                    
    //renderizar contratos para contratistas
    }else{
    
                await res.redirect('/');
            
            
     
    }    
};

export const contratosPendientes = async (req,res)=> {
    if (req.session.rol){
        await res.redirect('/index');
    }else{
        const uno = 1
        const dos = 2
    connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo FROM contratos WHERE (contratista_asignado =${req.session.c_identidad}) AND (estatus_ != 1) `,  async (error, results, fields)=>{
        if (req.session.loggedin) {
            if( results != undefined){
                    req.dashboard = results[0]
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat[0])
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: uno,
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
}

export const contratosEmitidos = async (req,res)=> {
    if (req.session.rol){
        await res.redirect('/index');
    }else{
        const uno = 1
        const dos = 2
    connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo FROM contratos WHERE (contratista_asignado =${req.session.c_identidad}) AND (estatus_ != 0) `,  async (error, results, fields)=>{
        if (req.session.loggedin) {
            if( results != undefined){
                    req.dashboard = results[0]
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat[0])
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: dos,
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
}

//Métodos para controlar que está auth en todas las páginas - renderizado de las páginas
export const loginAdminView = async(req, res)=> {
	if (req.session.loggedin) {
        console.log(req.session.loggedin)
		await res.render('login_admin',{
			login: true,
			name: req.session.name,
            rol: req.session.rol
		});
        
	} else {
        console.log(req.session.loggedin)
		await res.render('login_admin',{
			login:false,
			name:'Debe iniciar sesión',		
		});				
	}
}

export const loginView = async(req, res)=> {
	if (req.session.loggedin) {
        console.log(req.session.loggedin)
		await res.render('login',{
			login: true,
			name: req.session.name,
            rol: req.session.rol
		});
	} else {
        console.log(req.session.loggedin)
		await res.render('login',{
			login:false,
			name:'Debe iniciar sesión',		
		});				
	}
}

export const registerUser = async(req, res)=> {
	if (req.session.loggedin) {
        console.log(req.session.loggedin)
		await res.render('register_contratistas',{
			login: true,
			name: req.session.name,
            rol: req.session.rol,
            admin_email: req.session.email
		});
	} else {
        console.log(req.session.loggedin)
		await res.render('register_contratistas',{
            rol: false,
			login:false,
			name:'Debe iniciar sesión',	
            admin_email: false	
		});				
	}
}

export const uploadContrat = async (req,res)=>{
    if (req.session.loggedin) {
        console.log(req.session.loggedin)
		await res.render('uploadContrato',{
			login: true,
			name: req.session.name,
            rol: req.session.rol,
            admin_email: req.session.email
		});
	} else {
        console.log(req.session.loggedin)
		await res.render('uploadContrato',{
            rol: false,
			login:false,
			name:'Debe iniciar sesión',	
            admin_email: false	
		});				
	} 
}

export const updateContrat = async (req,res)=>{
    const id_contrato = req.params.id
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo`, `empresa_contratista` FROM `contratos` WHERE id = ? ', [id_contrato], async (error, results, fields)=>{
        if (req.session.loggedin) {
            if( results != undefined){
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat)
                    console.log(req.session.loggedin)
                    await res.render('updateContrato',{
                        login: true,
                        name: req.session.name,
                        rol: req.session.rol,
                        id_contrat:req.session.c_identidad,
                        sexo: req.session.sexo,
                        contratos: contrat,
                        empresa_contratista: req.session.empresa_contratista
                    }
                )
                
                } else {
                    console.log('no hay datos') 
                                    
                }
                 }else{
                    console.log(req.session.loggedin)
                    await res.redirect('/');
                }
    })
}

export const updateContratista = async (req,res)=>{
    const id_contrato = req.params.id
    connection.query ('SELECT * FROM contratistas WHERE C_Identidad = ? ', [id_contrato], async (error, results, fields)=>{
        if (req.session.loggedin && req.session.rol) {
            if( results != undefined){
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat)
                    console.log(req.session.loggedin)
                    await res.render('updateContratista',{
                        login: true,
                        name: req.session.name,
                        rol: req.session.rol,
                        id_contrat:req.session.c_identidad,
                        sexo: req.session.sexo,
                        contratos: contrat,
                        empresa_contratista:req.session.empresa_contratista
                    }
                )
                
                } else {
                    console.log('no hay datos') 
                                    
                }
                 }else{
                    console.log(req.session.loggedin)
                    await res.redirect('/');
                }
    })
}

//Método para registrar contratistas
export const registerMethod = async (req, res)=>{
    const c_identidad = req.body.c_identidad
    const email = req.body.email
    const pass = req.body.pass
    const n_telefono = req.body.n_telefono
    const nombres = req.body.nombres
    const apellidos = req.body.apellidos
    const empresa_contratista = req.body.empresa_contratista
    const sexo = req.body.sexo
    const confirm_pass = req.body.confirm_pass
     if (!(email && c_identidad && pass && n_telefono && nombres && apellidos && confirm_pass)){
         await   res.render('register_contratistas', {
                login: true,
                rol:true,
                alert: true,
                alertTitle: "Error",
                alertMessage: "Complete todos los campos",
                alertIcon:'error',
                showConfirmButton: true,
                timer: '',
                ruta: 'register'
            });
    
        }else if (!(pass==confirm_pass)){
            await res.render('register_contratistas', {
                login: true,
                rol:true,
                alert: true,
                alertTitle: "Error",
                alertMessage: "Contraseñas no coinciden",
                alertIcon:'error',
                showConfirmButton: true,
                timer: '',
                ruta: 'register'
            });
    
    
        }else{
        connection.query ('SELECT * FROM contratistas WHERE email = ?', [email], async (error, results, fields)=> {
            let resultados_array = [  '',  '',  '', '',  '',  '',  '']
           if (results != 0){
            resultados_array = results
           }
            console.log((resultados_array))
            if (results.length != 0 || email == resultados_array[0].email) {
                            res.render('register_contratistas', {
                                login: true,
                                rol:true,
                                alert: true,
                                alertTitle: "Error",
                                alertMessage: "Datos ya existentes (Correo Electrónico)",
                                alertIcon:'error',
                                showConfirmButton: true,
                                timer: '',
                                ruta: 'register'   })
            } else {
                connection.query ('SELECT * FROM contratistas WHERE n_telefono = ?', [n_telefono], async (error, results, fields)=> {
                    let resultados_array = [  '',  '',  '', '',  '',  '',  '',  '',  '', '', '' ]
           if (results != 0){
            resultados_array = results
           }
                    if (results.length != 0 || n_telefono == resultados_array[0].n_telefono) {
                    res.render('register_contratistas', {
                        login: true,
                        rol:true,
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Datos ya existentes (Número de Teléfono)",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: '',
                        ruta: 'register'   })
                } else {
                connection.query('SELECT * FROM contratistas WHERE c_identidad =?', [c_identidad], async (error, results, fields)=> {
                    let resultados_array = [  '',  '',  '', '',  '',  '',  '',  '',  '', '', '' ]
           if (results != 0){
            resultados_array = results
           }
                    if (results.length != 0 || c_identidad == resultados_array[0].c_identidad) {
                        res.render('register_contratistas', {
                            login: true,
                            rol:true,
                            alert: true,
                            alertTitle: "Error",
                            alertMessage: "Datos ya existentes (Cédula de Identidad)",
                            alertIcon:'error',
                            showConfirmButton: true,
                            timer: '',
                            ruta: 'register'   })
                    } else {
                        let passwordHash = await bcrypt.hash(pass, 8);  
                connection.query('INSERT INTO contratistas SET ?',{n_telefono:n_telefono, email:email, c_identidad:c_identidad, Nombres:nombres, Apellidos:apellidos, empresa:empresa_contratista, contraseña:passwordHash, sexo:sexo}, async (error,results) =>{ res.render('register_contratistas', {
                    login: true,
                    rol:true,
                    alert: true,
                    alertTitle: "Registration",
                    alertMessage: "¡Successful Registration!",
                    alertIcon:'success',
                    showConfirmButton: '',
                    timer: 1500,
                    ruta: 'index'
                });})
                    }
                })                 
            }
    })
                }
        })        
    }
}

//Método para requerir los datos de los contratos individuales cargados en la DB
export const loadContrat = async (req,res)=>{
    const id_contrato = req.params.id
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo`, `empresa_contratista` FROM `contratos` WHERE id = ? ', [id_contrato], async (error, results, fields)=>{
        if (req.session.loggedin) {
            if( results != undefined){
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat)
                    console.log(req.session.loggedin)
                    await res.render('contrato_fullview',{
                        login: true,
                        name: req.session.name,
                        rol: req.session.rol,
                        id_contrat:req.session.c_identidad,
                        sexo: req.session.sexo,
                        contratos: contrat,
                        empresa_contratista:req.session.empresa_contratista
                    }
                )
                
                } else {
                    console.log('no hay datos') 
                                    
                }
                 }else{
                    console.log(req.session.loggedin)
                    await res.redirect('/');
                }
    })

}

//Método para requerir los datos de los contratistas individuales de la DB
export const loadContratista = async (req,res)=>{
    const id_contratista = req.params.id

    if (req.session.loggedin){
        connection.query(`SELECT ct.C_Identidad, ct.contratos_pendientes, ct.inventario, ct.empresa, ct.Nombres, ct.Apellidos, ct.email, ct.n_telefono, ct.rol, ct.sexo, ct.contratos_instalados, DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, c.id, c.contratista_asignado, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion FROM contratistas AS ct INNER JOIN contratos AS c ON ct.C_Identidad = c.contratista_asignado WHERE ct.C_Identidad = ${id_contratista} `, async (error, results)=>{
            if(results == 0){
                connection.query(`SELECT * FROM contratistas WHERE C_Identidad = ${id_contratista}`, async(error, results)=>{

                    if (req.session.rol) {
                        if(error){
                            console.log (error)
                        
                        }else if( results != undefined){
                                let contrat = [results]
                                console.log (contrat)
                                console.log(req.session.loggedin)
                                await res.render('contratistas_fullview',{
                                    login: true,
                                    name: req.session.name,
                                    rol: req.session.rol,
                                    id_contrat:req.session.c_identidad,
                                    sexo: req.session.sexo,
                                    contratos: contrat,
                                }
                            )
            
                            if(results == 0){
                                console.log ('los resultados son falsos')}
                            
                            } else {
                                console.log('no hay datos') 
                                                
                            }
                            
                             }else{
                                console.log(req.session.loggedin)
                                await res.redirect('/index');
                            }

                })

            }else{
                connection.query (`SELECT ct.C_Identidad, ct.contratos_pendientes, ct.inventario, ct.empresa, ct.Nombres, ct.Apellidos, ct.email, ct.n_telefono, ct.rol, ct.sexo, ct.contratos_instalados, DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, c.id, c.contratista_asignado, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, c.estatus_ FROM contratistas AS ct INNER JOIN contratos AS c ON ct.C_Identidad = c.contratista_asignado WHERE ct.C_Identidad = ${id_contratista} ORDER BY fecha_contrato DESC`, async (error, results, fields)=>{
                    if (req.session.rol) {
                        if(error){
                            console.log (error)
                        
                        }else if( results != undefined){
                                let contrat = [results]
                                console.log (contrat)
                                console.log(req.session.loggedin)
                                await res.render('contratistas_fullview',{
                                    login: true,
                                    name: req.session.name,
                                    rol: req.session.rol,
                                    id_contrat:req.session.c_identidad,
                                    sexo: req.session.sexo,
                                    contratos: contrat,
                                }
                            )

                            
                            } else {
                                console.log('no hay datos') 
                                                
                            }
                            
                             }else{
                                console.log(req.session.loggedin)
                                await res.redirect('/index');
                            }
                        
                })
            }
        })

   
    }else{
        await res.redirect('/')
    }
}


//Método para subir nuevos contratos individualmente a la DB
export const uploadContratMethod =  async (req,res)=>{

const id  = req.body.id              
const fecha_contrato  = req.body.fecha_contrato
const estatus_  = req.body.estatus_
const id_cuenta  = req.body.id_cuenta
const ci_cliente = req.body.ci_cliente
const plan_contratado  = req.body.plan_contratado
const direccion_contrato  = req.body.direccion_contrato
const motivo_standby  = req.body.motivo_standby
const fecha_instalacion  = req.body.fecha_instalacion
const recursos_inventario_instalacion  = req.body.recursos_inventario_instalacion
const observaciones_instalacion  = req.body.observaciones_instalacion
const contratista_asignado  = req.body.contratista_asignado
const telefono_cliente  = req.body.telefono_cliente
const nodo  = req.body.nodo
const empresa_contratista = req.body.empresa_contratista
const empresa_contratista_ = req.session.empresa_contratista
if(req.session.rol == 2){

     if (!(id &&fecha_contrato&& ci_cliente  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
         await   res.render('uploadContrato', {
                login: true,
                rol:2,
                alert: true,
                alertTitle: "Error",
                alertMessage: "Complete todos los campos marcados con *",
                alertIcon:'error',
                showConfirmButton: true,
                timer: '',
                ruta: 'register'
            });
    
        }else{
        connection.query ('SELECT * FROM contratos WHERE id = ?', [id], async (error, results, fields)=> {
            let resultados_array = [  '',  '',  '', '',  '',  '',  '']
           if (results != 0){
            resultados_array = results
           }
            console.log((resultados_array))
            if (results.length != 0 || id == resultados_array[0].id) {
                            res.render('uploadContrato', {
                                login: true,
                                rol:2,
                                alert: true,
                                alertTitle: "Error",
                                alertMessage: "CONTRATO YA REGISTRADO",
                                alertIcon:'error',
                                showConfirmButton: true,
                                timer: '',
                                ruta: 'register'   })
            } else {  
                connection.query('INSERT INTO contratos SET ?',{id:id,
                    fecha_contrato:fecha_contrato,
                    estatus_:estatus_,
                    id_cuenta:id_cuenta,
                    ci_cliente:ci_cliente,
                    plan_contratado:plan_contratado,
                    direccion_contrato:direccion_contrato,
                    motivo_standby:motivo_standby,
                    fecha_instalacion:fecha_instalacion,
                    recursos_inventario_instalacion:recursos_inventario_instalacion,
                    observaciones_instalacion:observaciones_instalacion,
                    contratista_asignado:contratista_asignado,
                    telefono_cliente:telefono_cliente,
                    empresa_contratista:empresa_contratista,
                    nodo:nodo}, async (error,results) =>{ res.render('uploadContrato', {
                    login: true,
                    rol:2,
                    alert: true,
                    alertTitle: "Registration",
                    alertMessage: "¡Successful Registration!",
                    alertIcon:'success',
                    showConfirmButton: '',
                    timer: 1500,
                    ruta: 'index'
                });})
                    }
                })                 
            }
        }else if (req.session.rol== 1){
            if (!(id &&fecha_contrato&& ci_cliente  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
                await   res.render('uploadContrato', {
                       login: true,
                       rol:true,
                       alert: true,
                       alertTitle: "Error",
                       alertMessage: "Complete todos los campos marcados con *",
                       alertIcon:'error',
                       showConfirmButton: true,
                       timer: '',
                       ruta: 'register'
                   });
           
               }else{
               connection.query ('SELECT * FROM contratos WHERE id = ?', [id], async (error, results, fields)=> {
                   let resultados_array = [  '',  '',  '', '',  '',  '',  '']
                  if (results != 0){
                   resultados_array = results
                  }
                   console.log((resultados_array))
                   if (results.length != 0 || id == resultados_array[0].id) {
                                   res.render('uploadContrato', {
                                       login: true,
                                       rol:true,
                                       alert: true,
                                       alertTitle: "Error",
                                       alertMessage: "CONTRATO YA REGISTRADO",
                                       alertIcon:'error',
                                       showConfirmButton: true,
                                       timer: '',
                                       ruta: 'register'   })
                   } else {  
                       connection.query('INSERT INTO contratos SET ?',{id:id,
                           fecha_contrato:fecha_contrato,
                           estatus_:estatus_,
                           id_cuenta:id_cuenta,
                           ci_cliente:ci_cliente,
                           plan_contratado:plan_contratado,
                           direccion_contrato:direccion_contrato,
                           motivo_standby:motivo_standby,
                           fecha_instalacion:fecha_instalacion,
                           recursos_inventario_instalacion:recursos_inventario_instalacion,
                           observaciones_instalacion:observaciones_instalacion,
                           contratista_asignado:contratista_asignado,
                           telefono_cliente:telefono_cliente,
                           empresa_contratista:empresa_contratista_,
                           nodo:nodo}, async (error,results) =>{ res.render('uploadContrato', {
                           login: true,
                           rol:true,
                           alert: true,
                           alertTitle: "Registration",
                           alertMessage: "¡Successful Registration!",
                           alertIcon:'success',
                           showConfirmButton: '',
                           timer: 1500,
                           ruta: 'index'
                       });})
                           }
                       })                 
                   }
        }
    }

//Método para subir nuevos cotratos a la DB a través de XML o JSON
export const jsonrender = async (req,res,next) =>{
    console.log(req.file.filename);
    var parser = new xml2js.Parser();
        fs.readFile(ROOT_DIR +`./uploads/${req.file.filename}`, function(err, data) {
            if (err){
                console.log(err)
            }else{ 
        parser.parseString(data, function (err, result) {
            if (err){
                console.log(err)
                res.render('uploadContrato', {
                    login:true,
                    rol: 2,
                    alert: true,
                    alertTitle: "Carga Fallida",
                    alertMessage: 'Error de Sintáxis',
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: '',
                    ruta: 'upload-contrato'})
            }else{
                var confirmConfirm = false
                connection.query(`SELECT id FROM contratos`, async (error,results) =>{
                    console.log(results)
                    let confirm= false
                    for (let i = 0; i < result.contratos.contrato.length; i++) {
                       console.log(`resultado ${i} `, result.contratos.contrato[i].id)



                       for(let j = 0; j<results.length; j++){
                        console.log(results[j].id)

                        if (results[j].id == result.contratos.contrato[i].id) {
                            console.log(`ID ${results[j].id} YA EXISTENTE`)
                            confirm = true
                            break
                        }
                       }
                       if (confirm){
                        res.render('uploadContrato', {
                                        login:true,
                                        rol: 2,
                                        alert: true,
                                        alertTitle: "Carga Fallida",
                                        alertMessage: `ID ${result.contratos.contrato[i].id} YA EXISTENTE`,
                                        alertIcon:'error',
                                        showConfirmButton: true,
                                        timer: '',
                                        ruta: 'upload-contrato'})


                        break
                       }else{
                        console.log('lo lograste prro')
                        connection.query('INSERT INTO contratos SET ?', result.contratos.contrato[i], async (error, results, fields)=>{
                        if (!(error)){
                            console.log(results)
                            console.log('todo bn carnal')

                            
 
                        }else{
                            console.log(error)}
                             confirmConfirm = true
                        })
                       }
                       
                    }
                    if(confirmConfirm == false){
                        res.render('uploadContrato', {
                            login:true,
                            rol:2,
                            alert: true,
                            alertTitle: "subida exitosa",
                            alertMessage: "TODOS LOS CONTRATOS DE SU ARCHIVO XML",
                            alertIcon:'success',
                            showConfirmButton: '1',
                            timer: '',
                            ruta: 'index'
                        });      
                       }
                })
              
        console.log(result.contratos.contrato)

    }
        
    });}
    });

} 

export const uploadContratMethodXML = multerUpload.single('file')

app.use('/public', express.static(join(CURRENT_DIR, '../uploads'))); 

    //Método para actualizar contratos en la DB
export const updateContratMethod = async (req,res)=>{
    const id_contrato = req.params.id
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo`, `empresa_contratista` FROM `contratos` WHERE id = ? ', [id_contrato], async (error, results, fields)=>{
        let contrat = [results]

    if(req.session.rol == 2){
    const id  = req.body.id                                    
    const fecha_contrato  = req.body.fecha_contrato
    const estatus_  = req.body.estatus_
    const id_cuenta  = req.body.id_cuenta
    const ci_cliente = req.body.ci_cliente
    const plan_contratado  = req.body.plan_contratado
    const direccion_contrato  = req.body.direccion_contrato
    const motivo_standby  = req.body.motivo_standby
    const fecha_instalacion  = req.body.fecha_instalacion
    const recursos_inventario_instalacion  = req.body.recursos_inventario_instalacion
    const observaciones_instalacion  = req.body.observaciones_instalacion
    const contratista_asignado  = req.body.contratista_asignado
    const empresa_contratista = req.body.empresa_contratista
    const telefono_cliente  = req.body.telefono_cliente
    const nodo  = req.body.nodo
         if (!(id &&fecha_contrato  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
             await   res.render('updateContrato', {
                    login: true,
                    id_contrat:req.session.c_identidad,
                    rol:req.session.rol,
                    alert: true,
                    contratos: contrat,
                    empresa_contratista:req.session.empresa_contratista,
                    alertTitle: "Error",
                    alertMessage: "Complete todos los campos marcados con *",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: '',
                    ruta: `/update-contrato/${id_contrato}`
                });
        
            }else{
                connection.query ('SELECT id FROM contratos WHERE id != ?', [id_contrato], async (error, results, fields)=> {
                    let resultados_array = [  '',  '',  '', '',  '',  '',  '']
                   if (results != 0){
                    resultados_array = results
                   }
                    console.log((resultados_array[0]))
                    console.log(contrat)
                    let comp_id = false
                    let encontrado = false
                    for (let index = 0; index < resultados_array.length; index++) {
                        if (id==resultados_array[index].id){
                            encontrado = true
                           
                            break
                        }
                    }
                    if (encontrado){
                        comp_id = true
                        console.log('id es igual a compid')
                    } else{
                        comp_id = false
                        console.log('id NO es igual a compid')
                    }
                    // tenemos problemas XDD
    
                    //resuelto uwu
                    console.log(comp_id, id)
                if (comp_id) {
                                res.render('updateContrato', {
                                    login: true,
                                    rol:req.session.rol,
                                    id_contrat:req.session.c_identidad,
                                    contratos: contrat,
                                    empresa_contratista:req.session.empresa_contratista,
                                    alert: true,
                                    alertTitle: "Error",
                                    alertMessage: "CONTRATO YA REGISTRADO",
                                    alertIcon:'error',
                                    showConfirmButton: true,
                                    timer: '',
                                    ruta: `update-contrato/${id_contrato}`  })  
                } else {  
                    connection.query(`UPDATE contratos SET id='${id}',
                    fecha_contrato='${fecha_contrato}',
                    estatus_='${estatus_}',
                    ci_cliente= '${ci_cliente}',
                    id_cuenta='${id_cuenta}',
                    plan_contratado='${plan_contratado}',
                    direccion_contrato='${direccion_contrato}',
                    motivo_standby='${motivo_standby}',
                    fecha_instalacion='${fecha_instalacion}',
                    recursos_inventario_instalacion='${recursos_inventario_instalacion}',
                    observaciones_instalacion='${observaciones_instalacion}',
                    telefono_cliente='${telefono_cliente}',
                    contratista_asignado='${contratista_asignado}',
                    empresa_contratista = '${empresa_contratista}',
                    nodo='${nodo}' WHERE id = '${id_contrato}'` , async (error,results) =>{ 
                        if (error){
                            console.log(error)
                        }else{
                        
                        res.render('updateContrato', {
                        login: true,
                        rol:req.session.rol,
                        alert: true,
                        contratos:contrat,
                        id_contrat:req.session.c_identidad,
                        empresa_contratista:req.session.empresa_contratista,
                        alertTitle: "Registration",
                        alertMessage: "¡Successful Registration!",
                        alertIcon:'success',
                        showConfirmButton: '',
                        timer: 1500,
                        ruta: 'index'
                    });}})
                        }
                    })                 
                }

        }else if (req.session.rol == 1){
                const id  = req.body.id                                    
                const fecha_contrato  = req.body.fecha_contrato
                const estatus_  = req.body.estatus_
                const ci_cliente = req.body.ci_cliente
                const id_cuenta  = req.body. id_cuenta
                const plan_contratado  = req.body.plan_contratado
                const direccion_contrato  = req.body.direccion_contrato
                const motivo_standby  = req.body.motivo_standby
                const fecha_instalacion  = req.body.fecha_instalacion
                const recursos_inventario_instalacion  = req.body.recursos_inventario_instalacion
                const observaciones_instalacion  = req.body.observaciones_instalacion
                const telefono_cliente  = req.body.telefono_cliente
                const contratista_asignado  = req.body.contratista_asignado
                const nodo  = req.body.nodo
                     if (!(id &&fecha_contrato  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
                         await   res.render('updateContrato', {
                                login: true,
                                rol:req.session.rol,
                                alert: true,
                                id_contrat:req.session.c_identidad,
                                contratos: contrat,
                                empresa_contratista:req.session.empresa_contratista,
                                alertTitle: "Error",
                                alertMessage: "Complete todos los campos marcados con *",
                                alertIcon:'error',
                                showConfirmButton: true,
                                timer: false,
                                ruta: `update-contrato/${id_contrato}`
                            });
                    
                        }else{
                        connection.query ('SELECT id FROM contratos WHERE id != ?', [id_contrato], async (error, results, fields)=> {
                            let resultados_array = [  '',  '',  '', '',  '',  '',  '']
                           if (results != 0){
                            resultados_array = results
                           }
                            console.log((resultados_array))
                            console.log(contrat)
                            let comp_id = false
                            let encontrado = false
                            for (let index = 0; index < resultados_array.length; index++) {
                                if (id==resultados_array[index].id){
                                    encontrado = true
                                   
                                    break
                                }
                            }
                            if (encontrado){
                                comp_id = true
                                console.log('id es igual a compid')
                            } else{
                                comp_id = false
                                console.log('id NO es igual a compid')
                            }
                            // tenemos problemas XDD
            
                            //resuelto uwu
                            console.log(comp_id, id)
                            if (comp_id) {
                                            res.render('updateContrato', {
                                                login: true,
                                                rol:req.session.rol,
                                                id_contrat:req.session.c_identidad,
                                                contratos: contrat,
                                                empresa_contratista:req.session.empresa_contratista,
                                                alert: true,
                                                alertTitle: "Error",
                                                alertMessage: "CONTRATO YA REGISTRADO",
                                                alertIcon:'error',
                                                showConfirmButton: true,
                                                timer: false,
                                                ruta: `update-contrato/${id_contrato}`  })
                            } else {  
                                connection.query(`UPDATE contratos SET id='${id}',
                                    fecha_contrato='${fecha_contrato}',
                                    estatus_='${estatus_}',
                                    ci_cliente= '${ci_cliente}',
                                    id_cuenta='${id_cuenta}',
                                    plan_contratado='${plan_contratado}',
                                    direccion_contrato='${direccion_contrato}',
                                    motivo_standby='${motivo_standby}',
                                    fecha_instalacion='${fecha_instalacion}',
                                    recursos_inventario_instalacion='${recursos_inventario_instalacion}',
                                    observaciones_instalacion='${observaciones_instalacion}',
                                    telefono_cliente='${telefono_cliente}',
                                    contratista_asignado='${contratista_asignado}',
                                    nodo='${nodo}' WHERE id = '${id_contrato}'` ,async (error,results, fields) =>{ 
                                    
                                if (error){
                                    console.log(error)
                                } else {
                                    console.log(results)
                                    res.render('updateContrato', {
                                        login: true,
                                        rol: req.session.rol,
                                        alert: true,
                                        contratos: contrat,
                                        id_contrat:req.session.c_identidad,
                                        empresa_contratista:req.session.empresa_contratista,
                                        alertTitle: "Registration",
                                        alertMessage: "¡Actualización Correcta!",
                                        alertIcon:'success',
                                        showConfirmButton: '',
                                        timer: 1500,
                                        ruta: 'index'
                                    
                                        }
                                    )
                                }
                            }
                        )
                                    }
                                })                 
                            }
            }else if (req.session.rol == 0) {
                const id  = req.body.id                                    
    const estatus_  = req.body.estatus_
    const ci_cliente = req.body.ci_cliente
    const id_cuenta  = req.body. id_cuenta
    const plan_contratado  = req.body.plan_contratado
    const direccion_contrato  = req.body.direccion_contrato
    const motivo_standby  = req.body.motivo_standby
    const fecha_instalacion  = req.body.fecha_instalacion
    const recursos_inventario_instalacion  = req.body.recursos_inventario_instalacion
    const observaciones_instalacion  = req.body.observaciones_instalacion
    const telefono_cliente  = req.body.telefono_cliente
    const nodo  = req.body.nodo
         if (!(id &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
             await   res.render('updateContrato', {
                    login: true,
                    rol:req.session.rol,
                    alert: true,
                    id_contrat:req.session.c_identidad,
                    contratos: contrat,
                    empresa_contratista:req.session.empresa_contratista,
                    alertTitle: "Error",
                    alertMessage: "Complete todos los campos marcados con *",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: `update-contrato/${id_contrato}`
                });
        
            }else{
            connection.query ('SELECT id FROM contratos WHERE id != ?', [id_contrato], async (error, results, fields)=> {
                let resultados_array = [  '',  '',  '', '',  '',  '',  '']
               if (results != 0){
                resultados_array = results
               }
                console.log((resultados_array))
                console.log(contrat)
                let comp_id = false
                let encontrado = false
                for (let index = 0; index < resultados_array.length; index++) {
                    if (id==resultados_array[index].id){
                        encontrado = true
                       
                        break
                    }
                }
                if (encontrado){
                    comp_id = true
                    console.log('id es igual a compid')
                } else{
                    comp_id = false
                    console.log('id NO es igual a compid')
                }
                // tenemos problemas XDD

                //resuelto uwu
                console.log(comp_id, id)
                if (comp_id) {
                                res.render('updateContrato', {
                                    login: true,
                                    rol:req.session.rol,
                                    id_contrat:req.session.c_identidad,
                                    contratos: contrat,
                                    empresa_contratista:req.session.empresa_contratista,
                                    alert: true,
                                    alertTitle: "Error",
                                    alertMessage: "CONTRATO YA REGISTRADO",
                                    alertIcon:'error',
                                    showConfirmButton: true,
                                    timer: false,
                                    ruta: `update-contrato/${id_contrato}`  })
                } else {  
                    connection.query(`UPDATE contratos SET id='${id}',
                        estatus_='${estatus_}',
                        ci_cliente= '${ci_cliente}',
                        id_cuenta='${id_cuenta}',
                        plan_contratado='${plan_contratado}',
                        direccion_contrato='${direccion_contrato}',
                        motivo_standby='${motivo_standby}',
                        fecha_instalacion='${fecha_instalacion}',
                        recursos_inventario_instalacion='${recursos_inventario_instalacion}',
                        observaciones_instalacion='${observaciones_instalacion}',
                        telefono_cliente='${telefono_cliente}',
                        nodo='${nodo}' WHERE id = '${id_contrato}'` ,async (error,results, fields) =>{ res.render('updateContrato', {
                        login: true,
                        rol: req.session.rol,
                        id_contrat:req.session.c_identidad,
                        alert: true,
                        contratos: contrat,
                        empresa_contratista:req.session.empresa_contratista,
                        alertTitle: "Registration",
                        alertMessage: "¡Actualización Correcta!",
                        alertIcon:'success',
                        showConfirmButton: '',
                        timer: 1500,
                        ruta: 'index'
                    
                        }
                    )
                    if (error){console.log(error)} else {console.log(results)}
                }
            )
                        }
                    })                 
                }
            }
        })
    }

    // Método para eliminar contratos de la DB
export const deleteContrat = async (req,res) =>{
        const id_contrato = req.params.id
        if (req.session.loggedin && req.session.rol){
        connection.query('DELETE FROM contratos WHERE id = ?',[id_contrato], (error, results)=>{
            if(error){
                console.log(error);
            }else{           
                res.redirect('/index')
            }
        })}else{
            res.redirect('/')
        }
    
    }
    
    //Método para Finalizar contratos de la DB
    export const FinishContrat = async (req,res) =>{
        const id_contrato = req.params.id
        if (req.session.loggedin && req.session.rol == 2){
        connection.query('UPDATE contratos SET estatus_ = 2 WHERE id = ?',[id_contrato], (error, results)=>{
            if(error){
                console.log(error);
            }else{           
                res.redirect('/index')
            }
        })}else{
            res.redirect('/')
        }
    
    }

//Método para actualizar datos de los contratistas
export const updateContratistaMethod = async (req,res)=>{
        const id_contratista = req.params.id
        connection.query ('SELECT * FROM contratistas WHERE C_Identidad = ? ', [id_contratista], async (error, results, fields)=>{
            let contrat = [results]
       
                
    
        if(req.session.rol){
        const C_Identidad = req.body.C_Identidad
        const email = req.body.email
        const n_telefono = req.body.n_telefono
        const pass = req.body.pass
        const confirm_pass = req.body.confirm_pass
        const sexo = req.body.sexo
        const Nombres = req.body.Nombres
        const Apellidos = req.body.Apellidos
        const empresa_contratista = req.body.empresa_contratista
             if (!(C_Identidad &&email  &&n_telefono )){
                 await   res.render('updateContratista', {
                        login: true, 
                        rol:req.session.rol,
                        alert: true,
                        id_contrat:req.session.c_identidad,
                        contratos: contrat,
                        empresa_contratista:req.session.empresa_contratista,
                        alertTitle: "Error",
                        alertMessage: "Complete todos los campos marcados con *",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: `update-contrato/${id_contratista}`
                    });                        
                }else{
                    connection.query ('SELECT C_Identidad, n_telefono, email FROM contratistas WHERE C_Identidad != ?', [id_contratista], async (error, results, fields)=> {
                        let resultados_array = [  '',  '',  '', '',  '',  '',  '']
                       if (results != 0){
                        resultados_array = results
                       }
                        console.log((resultados_array))
                        console.log(contrat)
                        let comp_id = true
                        let encontrado = false
                        let encontrado_tel = false
                        let encontrado_email = false
                        for (let index = 0; index < resultados_array.length; index++) {
                            if (C_Identidad==resultados_array[index].C_Identidad){
                                encontrado = true
                               
                                break
                            }
                        }
                        for (let index = 0; index < resultados_array.length; index++) {
                            if (n_telefono==resultados_array[index].n_telefono){
                                encontrado_tel = true
                               
                                break
                            }
                        }
                        for (let index = 0; index < resultados_array.length; index++) {
                            if (email==resultados_array[index].email){
                                encontrado_email = true
                               
                                break
                            }
                        }
                        if (encontrado || encontrado_tel || encontrado_email){
                            comp_id = true
                            console.log('id es igual a compid')
                        } else{
                            comp_id = false
                            console.log('id NO es igual a compid')
                        }

                        
                        // tenemos problemas XDD
        
                        //resuelto uwu
                        console.log(comp_id, id_contratista)
                    if (comp_id) {
                                    res.render('updateContratista', {
                                        login: true,
                                        rol:req.session.rol,
                                        id_contrat:req.session.c_identidad,
                                        contratos: contrat,
                                        empresa_contratista:req.session.empresa_contratista,
                                        alert: true,
                                        alertTitle: "Error",
                                        alertMessage: "CONTRATISTA YA REGISTRADO",
                                        alertIcon:'error',
                                        showConfirmButton: true,
                                        timer: false,
                                        ruta: `update-contratista/${id_contratista}`  })  
                    } else {  
                        if (!(pass && confirm_pass)){

                            let passwordHash = await bcrypt.hash(pass, 8); 
                            connection.query(`UPDATE contratistas SET
                            C_Identidad='${C_Identidad}',
                            email='${email}',
                            n_telefono='${n_telefono}',
                            sexo='${sexo}',
                            Nombres='${Nombres}',
                            Apellidos='${Apellidos}',
                            empresa='${empresa_contratista}'
                            WHERE C_Identidad = '${id_contratista}'` , async (error,results) =>{
                                if(error){
                                    console.log(error)}else{
                                        console.log(results)
                                 res.render('updateContratista', {
                                login: true,
                                rol:true,
                                alert: true,
                                contratos: contrat,
                                empresa_contratista:req.session.empresa_contratista,
                                alertTitle: "Registration",
                                alertMessage: "¡Successful Registration!",
                                alertIcon:'success',
                                showConfirmButton: '',
                                timer: 1500,
                                ruta: `contratista/${id_contratista}`
                            })};})


                    }else if (!(pass==confirm_pass)){
                        await res.render('updateContratista', {
                            login: true,
                            rol:true,
                            alert: true,
                            contratos: contrat,
                            empresa_contratista:req.session.empresa_contratista,
                            alertTitle: "Error",
                            alertMessage: "Contraseñas no coinciden",
                            alertIcon:'error',
                            showConfirmButton: true,
                            timer: false,
                            ruta: `update-contratista/${id_contratista}` 
                        })
                    }else{
                        let passwordHash = await bcrypt.hash(pass, 8);
                        connection.query(`UPDATE contratistas SET
                        C_Identidad='${C_Identidad}',
                        email='${email}',
                        n_telefono='${n_telefono}',
                        sexo='${sexo}',
                        contraseña='${passwordHash}',
                        Nombres='${Nombres}',
                        Apellidos='${Apellidos}'
                        WHERE C_identidad = '${id_contratista}'` , async (error,results) =>{
                            if(error){
                            console.log(error)}else{
                                console.log(results)
                             res.render('updateContratista', {
                            login: true,
                            rol:true,
                            alert: true,
                            contratos: contrat,
                            empresa_contratista:req.session.empresa_contratista,
                            alertTitle: "Registration",
                            alertMessage: "¡Successful Registration!",
                            alertIcon:'success',
                            showConfirmButton: '',
                            timer: 1500,
                            ruta:  `contratista/${id_contratista}`
                        });}})
                    }
    
                            }
                        })                 
                    }
                }else{
                   res.redirect('/')
                }
            })
        }

//Método para eliminar contratistas de la DB
export const deleteContratista = async (req,res) =>{
            const id_contrato = req.params.id

            if (req.session.loggedin && req.session.rol){
                connection.query(`UPDATE contratistas SET C_Identidad = 0 WHERE C_identidad = ${id_contrato} `)
            connection.query('DELETE FROM contratistas WHERE C_Identidad = ?',[id_contrato], async (error, results)=>{
                if(error){
                    console.log(error);
                }else{           
                    res.redirect('/index')
                }
            })}else{
                res.redirect('/')
            }
        
        }        

//Método para filtrar datos de la base de datos en el index
export const filtroContratos = async (req,res)=>{

    const desde_fecha = req.body.desde_fecha
    const hasta_fecha = req.body.hasta_fecha
    const id_contrato = req.body.id_contrato
    const estatus_ = req.body.estatus_
    const empresa_contratista = req.body.empresa_contratista
    const instalador = req.body.instalador
    const nodo = req.body.nodo
    let empresa_contratista_= '0 OR 1'
    let id_instalador = ''
    if(req.session.rol == 1){
        empresa_contratista_ = req.session.empresa_contratista
    }
    
    if (req.session.rol == 0){
        id_instalador = req.session.c_identidad
        empresa_contratista_ = req.session.empresa_contratista
    }
    
// if(req.session.rol != 0){

    console.log(instalador)
    //combinación de 6
     if(desde_fecha&& hasta_fecha && id_contrato&& estatus_ && empresa_contratista && instalador && nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    
// combinación de 5
    /*1*/ }else if(instalador && empresa_contratista && estatus_ && id_contrato && desde_fecha && hasta_fecha) {
    
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    
    /*2*/ }else if(instalador && empresa_contratista && estatus_ && id_contrato && nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
        if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    /*3*/ }else if(desde_fecha&& hasta_fecha && estatus_ && empresa_contratista && instalador && nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    /*4*/ }else if(desde_fecha&& hasta_fecha && id_contrato&& empresa_contratista && instalador && nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*5*/ }else if(desde_fecha&& hasta_fecha && id_contrato&& estatus_ && instalador && nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(empresa_contratista_)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*6*/ }else if(desde_fecha&& hasta_fecha && id_contrato&& estatus_ && empresa_contratista && nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

        //Combinaciones de 4

    /*1*/ }else if(instalador && empresa_contratista && estatus_ && id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*2*/ }else if(instalador&& empresa_contratista& estatus_&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista}  AND contratista_asignado LIKE '${instalador}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

            
    /*3*/ }else if(instalador&& empresa_contratista&& estatus_&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista}  AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*4*/ }else if(instalador&& empresa_contratista&& id_contrato&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*5*/ }else if(instalador&& empresa_contratista&& id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
        
    /*6*/ }else if(instalador&&empresa_contratista&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  empresa_contratista = ${empresa_contratista}  AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*7*/ }else if(instalador&& estatus_&& id_contrato&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*8*/ }else if(instalador&& estatus_&& id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_}  AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*9*/ }else if(instalador&& estatus_&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_}  AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*10*/}else if(instalador&& id_contrato&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*11*/}else if(empresa_contratista&& estatus_&& id_contrato&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*12*/}else if(empresa_contratista&& estatus_&& id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*13*/}else if(empresa_contratista&& estatus_&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*14*/}else if(empresa_contratista&& id_contrato&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*15*/}else if(estatus_&& id_contrato&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND id like '${id_contrato}%'AND nodo LIKE '${nodo}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin, id_instalador, empresa_contratista_)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

        //combinaciones de 3
    /*1*/  }else if(instalador&& empresa_contratista&& estatus_){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista}  AND contratista_asignado LIKE '${instalador}% ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*2*/  }else if(instalador&& empresa_contratista&& id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*3*/  }else if(instalador&& empresa_contratista&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista}AND contratista_asignado LIKE '${instalador}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*4*/  }else if(instalador&& empresa_contratista&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%'  ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*5*/  }else if(instalador&& estatus_&& id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND id like '${id_contrato}%'  AND contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_})  ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*6*/  }else if(instalador&& estatus_ && desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*7*/  }else if(instalador&& estatus_&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND contratista_asignado LIKE '${instalador}%' AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*8*/  }else if(instalador&& id_contrato && desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE   id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*9*/  }else if(instalador&& id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*10*/  }else if(instalador&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*11*/  }else if(empresa_contratista&& estatus_&& id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*12*/  }else if(empresa_contratista&& estatus_ && desde_fecha&& hasta_fecha){

        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    /*13*/  }else if(empresa_contratista&& estatus_&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} 'AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*14*/  }else if(empresa_contratista&& id_contrato&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*15*/  }else if(empresa_contratista&& id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' 'AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*16*/  }else if(empresa_contratista && desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND nodo LIKE '${nodo}%' AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*17*/  }else if(estatus_&& id_contrato && desde_fecha&& hasta_fecha){

        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND id like '${id_contrato}%'  AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    /*18*/  }else if(estatus_&& id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_}  AND id like '${id_contrato}%' AND nodo LIKE '${nodo}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*19*/ }else if(estatus_&& desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND nodo LIKE '${nodo}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*20*/ }else if(id_contrato && desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })



          //combinaciones de 2
    /*1*/ }else if(instalador&& empresa_contratista){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND contratista_asignado LIKE '${instalador}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*2*/ }else if(instalador&& estatus_){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*3*/ }else if(instalador&& id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE id like '${id_contrato}%' AND contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*4*/ }else if(instalador&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE contratista_asignado LIKE '${instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*5*/ }else if(instalador&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE contratista_asignado LIKE '${instalador}%'AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*6*/ }else if(empresa_contratista&& estatus_){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND empresa_contratista = ${empresa_contratista} ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*7*/ }else if(empresa_contratista&& id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND id like '${id_contrato}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*8*/ }else if(empresa_contratista && desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*9*/ }else if(empresa_contratista&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*10*/ }else if(estatus_&& id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND id like '${id_contrato}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
        
    /*11*/ }else if(estatus_&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*12*/ }else if(estatus_&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE  estatus_ = ${estatus_} AND contratista_asignado LIKE '${id_instalador}%' AND nodo LIKE '${nodo}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*13*/ }else if(id_contrato&& desde_fecha&& hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE id like '${id_contrato}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*14*/ }else if(id_contrato&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE id like '${id_contrato}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND nodo LIKE '${nodo}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    /*15*/ }else if(desde_fecha&& hasta_fecha&& nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE nodo LIKE '${nodo}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) AND (fecha_contrato between '${desde_fecha}' AND '${hasta_fecha}') ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })



        //combinaciones únicas
    }else if(nodo){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE nodo LIKE '${nodo}%' AND contratista_asignado LIKE '${id_instalador}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
    
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin, nodo)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    }else if (instalador){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE contratista_asignado LIKE '${instalador}%'  AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC `, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin, instalador, results)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })

    }else if(desde_fecha && hasta_fecha){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE (fecha_contrato between '${desde_fecha}' and '${hasta_fecha}') AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    

    }else if(id_contrato){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE id like '${id_contrato}%' AND (empresa_contratista = ${empresa_contratista_}) ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
    
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin, id_contrato)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    
    

    }else if (empresa_contratista === '1' || empresa_contratista === '0'){
        connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE empresa_contratista = ${empresa_contratista} AND contratista_asignado LIKE '${id_instalador}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
            if(error){
                console.log(error)
    
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin, empresa_contratista)
                    await res.render('index',{
                        estatus: false,
                        login: req.session.loggedin,
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
                res.redirect('/')
            }
        }
        })
    

    }else if (estatus_=== '2' || estatus_ === '1' || estatus_=== '0'){

    connection.query(`SELECT DATE_FORMAT(fecha_contrato, "%Y-%m-%d") AS fecha_contrato, id, ci_cliente, estatus_, id_cuenta, plan_contratado, direccion_contrato, motivo_standby, DATE_FORMAT(fecha_instalacion, "%Y-%m-%d") AS fecha_instalacion, recursos_inventario_instalacion, observaciones_instalacion, contratista_asignado, telefono_cliente, nodo, empresa_contratista FROM contratos  WHERE estatus_ = ${estatus_} AND (empresa_contratista = ${empresa_contratista_}) AND contratista_asignado LIKE '${id_instalador}%' ORDER BY fecha_contrato ASC`, async(error,results)=>{
        if(error){
            console.log(error)

        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin, estatus_)
                await res.render('index',{
                    estatus: false,
                    login: req.session.loggedin,
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
            res.redirect('/')
        }
    }
    })

    }else{
        res.redirect('/index')
    }
// }else{
//     res.redirect('/index')
// }
}

export const filtroContratistas = async (req,res)=>{
    const C_Identidad = req.body.C_Identidad
    const empresa_contratista = req.body.empresa
    const Nombres = req.body.Nombres
    const Apellidos = req.body.Apellidos
    let empresa_contratista_= '0 OR 1'
    if(req.session.rol == 1){
        empresa_contratista_ = req.session.empresa_contratista
    }
    //combinacion de 4
    if(C_Identidad && empresa_contratista && Nombres && Apellidos){
        connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND empresa = ${empresa_contratista} AND Nombres LIKE '%${Nombres}%'AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('contratistas_listview',{
                        estatus: false,
                        login: req.session.loggedin,
                        name: req.session.name,
                        rol: req.session.rol,
                        sexo: req.session.sexo,
                        contratistas: contrat
                    }
                );
                } else {
                    console.log('no hay datos') 
                                    
                }
            }else{
                res.redirect('/')
            }
        }
        })
        //combinación de 3
/*1*/    }else if (C_Identidad&& Nombres&& empresa_contratista){
        connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND empresa = ${empresa_contratista} AND Nombres LIKE '%${Nombres}%'`, async(error, results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('contratistas_listview',{
                        estatus: false,
                        login: req.session.loggedin,
                        name: req.session.name,
                        rol: req.session.rol,
                        sexo: req.session.sexo,
                        contratistas: contrat
                    }
                );
                } else {
                    console.log('no hay datos') 
                                    
                }
            }else{
                res.redirect('/')
            }
        }
        })

/*2*/    }else if (C_Identidad&& Nombres&& Apellidos){
        connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND (empresa_contratista = ${empresa_contratista_}) AND Nombres LIKE '%${Nombres}%'AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('contratistas_listview',{
                        estatus: false,
                        login: req.session.loggedin,
                        name: req.session.name,
                        rol: req.session.rol,
                        sexo: req.session.sexo,
                        contratistas: contrat
                    }
                );
                } else {
                    console.log('no hay datos') 
                                    
                }
            }else{
                res.redirect('/')
            }
        }
        })

/*3*/    }else if (C_Identidad&& empresa_contratista&& Apellidos){
        connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND empresa = ${empresa_contratista} AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
            if(error){
                console.log(error)
            }else{
                if(req.session.loggedin){
                if( results != undefined){
                    let contrat = [results]
                    console.log (contrat)
                    console.log(req.session.loggedin)
                    await res.render('contratistas_listview',{
                        estatus: false,
                        login: req.session.loggedin,
                        name: req.session.name,
                        rol: req.session.rol,
                        sexo: req.session.sexo,
                        contratistas: contrat
                    }
                );
                } else {
                    console.log('no hay datos') 
                                    
                }
            }else{
                res.redirect('/')
            }
        }
        })

/*4*/    }else if (Nombres&& empresa_contratista&& Apellidos){

            connection.query(`SELECT * FROM contratistas WHERE empresa = ${empresa_contratista} AND Nombres LIKE '%${Nombres}%' AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
                if(error){
                    console.log(error)
                }else{
                    if(req.session.loggedin){
                    if( results != undefined){
                        let contrat = [results]
                        console.log (contrat)
                        console.log(req.session.loggedin)
                        await res.render('contratistas_listview',{
                            estatus: false,
                            login: req.session.loggedin,
                            name: req.session.name,
                            rol: req.session.rol,
                            sexo: req.session.sexo,
                            contratistas: contrat
                        }
                    );
                    } else {
                        console.log('no hay datos') 
                                        
                    }
                }else{
                    res.redirect('/')
                }
            }
            })
        

           


/*1*/    }else if(C_Identidad&& Nombres){
            connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND (empresa = ${empresa_contratista_}) AND Nombres LIKE '%${Nombres}%'`, async(error, results)=>{
                if(error){
                    console.log(error)
                }else{
                    if(req.session.loggedin){
                    if( results != undefined){
                        let contrat = [results]
                        console.log (contrat)
                        console.log(req.session.loggedin)
                        await res.render('contratistas_listview',{
                            estatus: false,
                            login: req.session.loggedin,
                            name: req.session.name,
                            rol: req.session.rol,
                            sexo: req.session.sexo,
                            contratistas: contrat
                        }
                    );
                    } else {
                        console.log('no hay datos') 
                                        
                    }
                }else{
                    res.redirect('/')
                }
            }
            })
            
/*2*/    }else if(C_Identidad && empresa_contratista ){
    connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND empresa = ${empresa_contratista}`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }

/*3*/    }else if(C_Identidad && empresa_contratista && Nombres && Apellidos){
    connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND empresa = ${empresa_contratista} AND Nombres LIKE '%${Nombres}%'AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })
                
        }else{
            res.redirect('/')
        }
    }
    })

/*3*/    }else if(C_Identidad&& Apellidos){
    connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND (empresa = ${empresa_contratista_}) AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })
        
/*4*/    }else if(empresa_contratista && Nombres){
    connection.query(`SELECT * FROM contratistas WHERE empresa = ${empresa_contratista} AND Nombres LIKE '%${Nombres}%'`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })
    
/*5*/    }else if(Nombres && Apellidos){
    connection.query(`SELECT * FROM contratistas WHERE Nombres LIKE '%${Nombres}%' AND (empresa = ${empresa_contratista_}) AND  Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })

/*6*/    }else if(empresa_contratista && Apellidos){
            connection.query(`SELECT * FROM contratistas WHERE AND empresa = ${empresa_contratista} AND Nombres LIKE '%${Nombres}%'AND Apellidos LIKE '%${Apellidos}%'`, async(error, results)=>{
                if(error){
                    console.log(error)
                }else{
                    if(req.session.loggedin){
                    if( results != undefined){
                        let contrat = [results]
                        console.log (contrat)
                        console.log(req.session.loggedin)
                        await res.render('contratistas_listview',{
                            estatus: false,
                            login: req.session.loggedin,
                            name: req.session.name,
                            rol: req.session.rol,
                            sexo: req.session.sexo,
                            contratistas: contrat
                        }
                    );
                    } else {
                        console.log('no hay datos') 
                                        
                    }
                }else{
                    res.redirect('/')
                }
            }
            })
                
/*1*/    }else if (C_Identidad){
    connection.query(`SELECT * FROM contratistas WHERE C_Identidad LIKE '${C_Identidad}%' AND (empresa = ${empresa_contratista_})`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })          
    
    
/*2*/    }else if (Nombres){
    connection.query(`SELECT * FROM contratistas WHERE  Nombres LIKE '%${Nombres}%' AND (empresa = ${empresa_contratista_})`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })
    
/*3*/    }else if (empresa_contratista){
    connection.query(`SELECT * FROM contratistas WHERE  empresa = ${empresa_contratista}`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })    


/*4*/    }else if (Apellidos){
    connection.query(`SELECT * FROM contratistas WHERE Apellidos LIKE '%${Apellidos}%' AND (empresa = ${empresa_contratista_})`, async(error, results)=>{
        if(error){
            console.log(error)
        }else{
            if(req.session.loggedin){
            if( results != undefined){
                let contrat = [results]
                console.log (contrat)
                console.log(req.session.loggedin)
                await res.render('contratistas_listview',{
                    estatus: false,
                    login: req.session.loggedin,
                    name: req.session.name,
                    rol: req.session.rol,
                    sexo: req.session.sexo,
                    contratistas: contrat
                }
            );
            } else {
                console.log('no hay datos') 
                                
            }
        }else{
            res.redirect('/')
        }
    }
    })
            

    }  else {
        res.redirect('/contratista')
    }

}

//función para limpiar la caché luego del logout
app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
}
);

//Logout
//Destruye la sesión.
export const logout = function (req, res, next) {
req.session.destroy(() => {
  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
})
}; 