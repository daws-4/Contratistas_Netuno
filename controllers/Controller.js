import express from "express";
import morgan from 'morgan'
const app = express()
app.use(morgan("dev"));
import bcrypt from "bcryptjs"
import mysql from 'mysql'
import { pool } from "../database/db.js";
import { connection } from "../app.js";

/*export const index = (req, res, next)=>{
 res.render('index')
 next()

console.log (req.session)
}
*/
export const loginView = async (req, res, next)=>{
   await res.render('login');
}

export const registerUser = async(req, res, next)=>{
    await res.render('register_usuarios');
}


// Método para registro de contratistas
export const registerMethod = async (req, res)=>{
const c_identidad = req.body.c_identidad;
const email = req.body.email;
const pass = req.body.pass;
const n_telefono = req.body.n_telefono
const nombres = req.body.nombres
const apellidos = req.body.apellidos
const empresa_contratista = req.body.empresa_contratista
    // results[0].n_telefono = 0
    // results[0].email = 0
    // results[0].c_identidad = 0
if (pass.length < 7){
    res.render('register', {
        alert: true,
        alertTitle: "Error",
        alertMessage: "La Contraseña debe ser de 8 carácteres mínimo",
        alertIcon:'error',
        showConfirmButton: true,
        timer: false,
        ruta: 'register'   
    });}
else{
    if (!(email && c_identidad && pass && n_telefono && nombres && apellidos && empresa_contratista)){
        res.render('register_usuarios', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Complete todos los campos",
            alertIcon:'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'register'
        });
    }else{
    connection.query ('SELECT * FROM contratistas WHERE email = ?', [email], async (error, results, fields)=> {
        let resultados_array = [  '',  '',  '', '',  '',  '',  '',  '',  '', '' ]
       if (results != 0){
        resultados_array = results
       }
        console.log((resultados_array))
        if (results.length != 0 || email == resultados_array[0].email) {
                        res.render('register_usuarios', {
                            alert: true,
                            alertTitle: "Error",
                            alertMessage: "Datos ya existentes (Correo Electrónico)",
                            alertIcon:'error',
                            showConfirmButton: true,
                            timer: false,
                            ruta: 'register'   })
        } else {
            connection.query ('SELECT * FROM contratistas WHERE n_telefono = ?', [n_telefono], async (error, results, fields)=> {
                let resultados_array = [  '',  '',  '', '',  '',  '',  '',  '',  '', '' ]
       if (results != 0){
        resultados_array = results
       }
                if (results.length != 0 || n_telefono == resultados_array[0].n_telefono) {
                res.render('register_usuarios', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Datos ya existentes (Número de Teléfono)",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'register'   })
            } else {
            connection.query('SELECT * FROM contratistas WHERE c_identidad =?', [c_identidad], async (error, results, fields)=> {
                let resultados_array = [  '',  '',  '', '',  '',  '',  '',  '',  '', '' ]
       if (results != 0){
        resultados_array = results
       }
                if (results.length != 0 || c_identidad == resultados_array[0].c_identidad) {
                    res.render('register_usuarios', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Datos ya existentes (Cédula de Identidad)",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'register'   })
                } else {
                    let passwordHash = await bcrypt.hash(pass, 8);  
            connection.query('INSERT INTO contratistas SET ?',{n_telefono:n_telefono, email:email, c_identidad:c_identidad, Nombres:nombres, Apellidos:apellidos, empresa_contratista:empresa_contratista,contraseña:passwordHash}, async (error,results) =>{ res.render('register_usuarios', {
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
}}
}

// Metodo de incio de sesión
export const loginMethod = async (req, res)=> {
const email = req.body.email;
const password = req.body.password;    
let passwordHash = await bcrypt.hash(password, 8);
if (email && password) {
    connection.query('SELECT * FROM contratistas WHERE email = ?', [email], async (error, results, fields)=> {
        if( results.length == 0 || !( await bcrypt.compare(password, results[0].contraseña)) ) {    
            res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "USUARIO y/o PASSWORD incorrectas",
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
            res.render('login', {
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

//12 - Método para controlar que está auth en todas las páginas
export const loginAuth = (req, res, next)=> {
	if (req.session.loggedin) {
		res.render('index',{
			login: true,
			name: req.session.name	
		});
	} else {
		res.render('index',{
			login:false,
			name:'Debe iniciar sesión',			
		});				
	}
};


//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
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
