require('dotenv').config();
const mongoose = require("mongoose");
const httpServer =require("./app");
const port = process.env.PORT || 4001;


process.on("uncaughtException" , (err)=>{
    console.log("uncaughtException Shutting down application");
    console.log(err.name , err.message);
    process.exit(1);
})




mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log('MongoDB connected');
    httpServer.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}).catch(err => console.log(err));



process.on("uncaughtException" , (err)=>{
    console.log("uncaughtException Shutting down application");
    console.log(err.name , err.message);

    server.close(()=>{
        process.exit(1);
    })
})

