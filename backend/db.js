const mongoose = require('mongoose');

const connectDB= async()=>{
    try
    {
        const con=await mongoose.connect('mongodb://localhost:27017/Assessment');

        console.log(`DB Connected ${con.connection.host}`);
    }
    catch(e)
    {
        console.log(`error :${e}`);
        process.exit();
    }
}
module.exports=connectDB;