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


