import express from "express";
import path from "path";
import morgan from "morgan";
import bodyParser from 'body-parser'
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs"
import { Server }from "socket.io"
import session from 'express-session'
import router from "./routes/routes.js"; 
import multer from "multer";
import { dirname, join,extname } from "path";

const IP = '172.16.0.219'

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));


const server = app.listen(3000, (req, res)=>{
  console.log('SERVER RUNNING IN http://localhost:3000');
});
export const io = new Server(server);
// settings
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Para poder capturar los datos del formulario (sin urlencoded nos devuelve "undefined")
app.use(express.urlencoded({extended:false}));
app.use(express.json());//además le decimos a express que vamos a usar json
// middlewares
app.use(morgan("dev"));

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true,
  cookie: {maxAge: (2* 60* 60* 1000)}
}));

//Invocamos a dotenv
import dotenv from "dotenv"
dotenv.config({ path: './env/.env'});

//seteamos el directorio de assets
app.use('/resources',express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, "public")));



// Establecemos el motor de plantillas
app.set('view engine','ejs');



// variables de session

//conexión a la base de datos
import mysql from 'mysql'
export const connection = mysql.createConnection({
    //Con variables de entorno
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_DATABASE
});

connection.connect((error)=>{
    if (error) {
      console.error('El error de conexión es: ' + error);
      return;
    }
    console.log('¡Conectado a la Base de Datos!');
  });



  //No pude hacerlo con controller y rutas so aquí quedó

  // const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
// const MIMETYPES = ['text/xml', 'image/jpeg', 'image/png'];

// export const multerUpload = multer({
//     storage: multer.diskStorage({
//         destination: join(CURRENT_DIR, './uploads'),
//         filename: (req, file, cb) => {
//             const fileExtension = extname(file.originalname);
//             const fileName = file.originalname.split(fileExtension)[0];

//             cb(null, `${fileName}-${Date.now()}${fileExtension}`);
//         },
//     }),
//     fileFilter: (req, file, cb) => {
//         if (MIMETYPES.includes(file.mimetype)) cb(null, true);
//         else cb(new Error(`Only ${MIMETYPES.join(' ')} mimetypes are allowed`));
//     },
//     limits: {
//         fieldSize: 10000000,
//     },
// });



// app.post('/json', multerUpload.single('file'), (req, res) => {
//     console.log(req.file);

//     res.sendStatus(200);
// });

// app.use('/public', express.static(join(CURRENT_DIR, './uploads')));
  


  app.use(router)

  // app.use('/public', express.static(join(CURRENT_DIR, '../uploads')));

  // app.use(multerUpload.single('file'))
 
  

 