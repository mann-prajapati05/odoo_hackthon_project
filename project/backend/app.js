import dotenv from "dotenv";
import express from "express";

dotenv.config();
const app=express();

const PORT=process.env.PORT || 8080;
app.get('/',(req,res,next)=>{
    res.send("hey");
})
app.listen(PORT,()=>{
    console.log(`serevr running on http://localhost:${PORT}/`);
})
