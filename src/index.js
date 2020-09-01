const express = require("express");
require("./db/mongoose"); //run mongoose driver
const userRouter = require("./routers/user")
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

/*site under maintenance
app.use((req, res, next)=>{ //enable when needed
    if(req.method){
        res.status(503).send("Site Under Maintenance");
    }
});
*/ 

//see docs: https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded/51844327
app.use(express.json()); 

//router middleware
app.use(userRouter); 
app.use(taskRouter); 


//start server
app.listen(port, ()=>{
    console.log(`server is now running on port ${port}`);
});











