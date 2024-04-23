import express from "express";
import morgan from 'morgan'
const app = express()
app.use(morgan("dev"));
import bcrypt from "bcryptjs"
import multer from "multer";
import { connection } from "../app.js";
import { parseString } from "xml2js";
import xml2js from 'xml2js'
import fs from 'node:fs'
import formidable from "formidable";
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { format } from "node:path";


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
                    timer: false,
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
            res.render('login', {
                login:false,
                alert: true,
                alertTitle: "Conexión exitosa",
                alertMessage: "¡LOGIN CORRECTO!",
                alertIcon:'success',
                showConfirmButton: false,
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
                        timer: false,
                        ruta: '',
                    });
                
                //Mensaje simple y poco vistoso
                //res.send('Incorrect Username and/or Password!');				
            } else {         
                console.log(results[0])
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
                    showConfirmButton: false,
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

    if(req.session.rol == 2){

        //renderizar contratos para administradores
        connection.query('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos`', async (error, results, fields)=>{
            if (req.session.loggedin) {
                if( results != undefined){
                        req.dashboard = results[0]
                        let contrat = [results]
                        console.log (contrat[0])
                        console.log(req.session.loggedin)
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

            }else if (req.session.rol == 1){
                //renderizar contratos para administradores contratistas
        connection.query('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos` WHERE empresa_contratista = ?', [req.session.empresa_contratista], async (error, results, fields)=>{
            if (req.session.loggedin) {
                if( results != undefined){
                        req.dashboard = results[0]
                        let contrat = [results]
                        console.log (contrat[0])
                        console.log(req.session.loggedin)
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
    }else{
        connection.query('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos` WHERE contratista_asignado = ? ', [req.session.c_identidad], async (error, results, fields)=>{
	if (req.session.loggedin) {
        if( results != undefined){
                req.dashboard = results[0]
                let contrat = [results]
                console.log (req.session.c_identidad, contrat[0])
                console.log(req.session.loggedin)
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
    }    
};

export const loginEditContratistaAuth = async (req, res, next)=> {

    if(req.session.loggedin){
        if (req.session.rol == 2) {
        //renderizar contratos para administradores
        connection.query('SELECT * FROM `contratistas`', async (error, results, fields)=>{
           
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
                    }else if (req.session.loggedin == 1){


                        connection.query('SELECT * FROM `contratistas` WHERE empresa_contratista = ?' ,[req.session.empresa_contratista], async (error, results, fields)=>{
           
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
};
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
};
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
};

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
                timer: false,
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
                timer: false,
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
                                timer: false,
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
                        timer: false,
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
                            timer: false,
                            ruta: 'register'   })
                    } else {
                        let passwordHash = await bcrypt.hash(pass, 8);  
                connection.query('INSERT INTO contratistas SET ?',{n_telefono:n_telefono, email:email, c_identidad:c_identidad, Nombres:nombres, Apellidos:apellidos, empresa_contratista:empresa_contratista, contraseña:passwordHash, sexo:sexo}, async (error,results) =>{ res.render('register_contratistas', {
                    login: true,
                    rol:true,
                    alert: true,
                    alertTitle: "Registration",
                    alertMessage: "¡Successful Registration!",
                    alertIcon:'success',
                    showConfirmButton: false,
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
    connection.query ('SELECT * FROM contratistas WHERE C_Identidad = ? ', [id_contratista], async (error, results, fields)=>{
        if (req.session.rol) {
            if( results != undefined){
                    let contrat = [results]
                    console.log (req.session.c_identidad, contrat)
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
     if (!(id &&fecha_contrato&& ci_cliente  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
         await   res.render('uploadContrato', {
                login: true,
                rol:true,
                alert: true,
                alertTitle: "Error",
                alertMessage: "Complete todos los campos marcados con *",
                alertIcon:'error',
                showConfirmButton: true,
                timer: false,
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
                                timer: false,
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
                    rol:true,
                    alert: true,
                    alertTitle: "Registration",
                    alertMessage: "¡Successful Registration!",
                    alertIcon:'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: 'index'
                });})
                    }
                })                 
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
            }else{
                for (let index = 0; index < result.contratos.contrato.length; index++) {
                    connection.query('INSERT INTO contratos SET ?', result.contratos.contrato[index], async (error, results, fields)=>{
                        if (error)
                        {
                            console.log(error)
                        }else{
                            console.log(results)
                        }
                    })
                }
        
        console.log(result.contratos.contrato)
        console.log(result);
        console.log('Done');
    }
        
    });}
    });
    res.redirect('/index')
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
                        empresa_contratista:req.session.empresa_contratista,
                        alertTitle: "Registration",
                        alertMessage: "¡Successful Registration!",
                        alertIcon:'success',
                        showConfirmButton: false,
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
                                    nodo='${nodo}' WHERE id = '${id_contrato}'` ,async (error,results, fields) =>{ res.render('updateContrato', {
                                    login: true,
                                    rol: req.session.rol,
                                    alert: true,
                                    contratos: contrat,
                                    empresa_contratista:req.session.empresa_contratista,
                                    alertTitle: "Registration",
                                    alertMessage: "¡Actualización Correcta!",
                                    alertIcon:'success',
                                    showConfirmButton: false,
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
            }else{
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
                        nodo='${nodo}' WHERE id = '${id_contrato}'` ,async (error,results, fields) =>{ res.render('updateContrato', {
                        login: true,
                        rol: req.session.rol,
                        alert: true,
                        contratos: contrat,
                        empresa_contratista:req.session.empresa_contratista,
                        alertTitle: "Registration",
                        alertMessage: "¡Actualización Correcta!",
                        alertIcon:'success',
                        showConfirmButton: false,
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
                            empresa_contratista='${empresa_contratista}'
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
                                showConfirmButton: false,
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
                            showConfirmButton: false,
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
            connection.query('DELETE FROM contratistas WHERE C_Identidad = ?',[id_contrato], (error, results)=>{
                if(error){
                    console.log(error);
                }else{           
                    res.redirect('/index')
                }
            })}else{
                res.redirect('/')
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