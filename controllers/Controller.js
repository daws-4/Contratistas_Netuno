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

    if(req.session.rol){

        //renderizar contratos para administradores
        connection.query('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos`', async (error, results, fields)=>{
            if (req.session.loggedin) {
                if( results != undefined){
                        req.dashboard = results[0]
                        let contrat = [results]
                        console.log (contrat[0])
                        console.log(req.session.loggedin)
                        await res.render('index',{
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

        //renderizar contratos para administradores
        connection.query('SELECT * FROM `contratistas`', async (error, results, fields)=>{
            if (req.session.rol) {
                if( results != undefined){
                        let contrat = [results]
                        console.log (contrat[0])
                        console.log(req.session.loggedin)
                        await res.render('contratistas_listview',{
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
                     }else{
                        console.log(req.session.loggedin)
                        await res.redirect('/index');
                    }
                    
             })
    //renderizar contratos para contratistas
    }else{
    
                await res.redirect('/');
            
            
     
    }    
};

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
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos` WHERE id = ? ', [id_contrato], async (error, results, fields)=>{
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


app.use(function (req,res,next){
    if (req.user){
    }
})

//Método para requerir los datos de los contratos individuales cargados en la DB
export const loadContrat = async (req,res)=>{
    const id_contrato = req.params.id
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos` WHERE id = ? ', [id_contrato], async (error, results, fields)=>{
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


//Método para subir nuevos contratos a la DB

export const uploadContratMethod = async (req,res)=>{

const id  = req.body.id                                    
const fecha_contrato  = req.body.fecha_contrato
const estatus_  = req.body.estatus_
const id_cuenta  = req.body. id_cuenta
const plan_contratado  = req.body.plan_contratado
const direccion_contrato  = req.body.direccion_contrato
const motivo_standby  = req.body.motivo_standby
const fecha_instalacion  = req.body.fecha_instalacion
const recursos_inventario_instalacion  = req.body.recursos_inventario_instalacion
const observaciones_instalacion  = req.body.observaciones_instalacion
const contratista_asignado  = req.body.contratista_asignado
const telefono_cliente  = req.body.telefono_cliente
const nodo  = req.body.nodo
     if (!(id &&fecha_contrato  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
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
                    plan_contratado:plan_contratado,
                    direccion_contrato:direccion_contrato,
                    motivo_standby:motivo_standby,
                    fecha_instalacion:fecha_instalacion,
                    recursos_inventario_instalacion:recursos_inventario_instalacion,
                    observaciones_instalacion:observaciones_instalacion,
                    contratista_asignado:contratista_asignado,
                    telefono_cliente:telefono_cliente,
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

    //Método para actualizar contratos en la DB
export const updateContratMethod = async (req,res)=>{
    const id_contrato = req.params.id
    connection.query ('SELECT DATE_FORMAT(fecha_contrato, "%d/%m/%Y") AS fecha_contrato, `id`, `ci_cliente`, `estatus_`, `id_cuenta`, `plan_contratado`, `direccion_contrato`, `motivo_standby`, DATE_FORMAT(fecha_instalacion, "%d/%m/%Y") AS fecha_instalacion, `recursos_inventario_instalacion`, `observaciones_instalacion`, `contratista_asignado`, `telefono_cliente`, `nodo` FROM `contratos` WHERE id = ? ', [id_contrato], async (error, results, fields)=>{
        let contrat = [results]

    if(req.session.rol){
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
         if (!(id &&fecha_contrato  &&estatus_  &&id_cuenta  &&plan_contratado  &&direccion_contrato  &&nodo )){
             await   res.render('updateContrato', {
                    login: true,
                    rol:req.session.rol,
                    alert: true,
                    id_contrat:req.session.c_identidad,
                    contratos: contrat,
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
                    contratista_asignado='${contratista_asignado}'
                    nodo='${nodo}' WHERE id = '${id_contrato}'` , async (error,results) =>{ res.render('updateContrato', {
                        login: true,
                        rol:true,
                        alert: true,
                        alertTitle: "Registration",
                        alertMessage: "¡Successful Registration!",
                        alertIcon:'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: '/index'
                    });})
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
                        rol:true,
                        alert: true,
                        contratos: contrat,
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
//PENDIENTE
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
                            contraseña='${passwordHash}',
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
                            alertTitle: "Error",
                            alertMessage: "Contraseñas no coinciden",
                            alertIcon:'error',
                            showConfirmButton: true,
                            timer: false,
                            ruta: `update-contratista/${id_contratista}` 
                        })
                    }else{
                        connection.query(`UPDATE contratistas SET
                        C_Identidad='${C_Identidad}',
                        email='${email}',
                        n_telefono='${n_telefono}',
                        sexo='${sexo}',
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
});


//Logout
//Destruye la sesión.
export const logout = function (req, res, next) {
req.session.destroy(() => {
  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
})
};

