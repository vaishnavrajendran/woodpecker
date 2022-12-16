const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/eshoppe');

const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session');
var $  = require( 'jquery' );

app.use(cookieParser());

app.use((req,res,next)=>{
    res.set('cache-control','no-cache,no-store,mustrevalidate,max-stale=0,post-check=0,prechecked=0')
    next()
});
//for user routes
const userRoute = require('./routes/userRoute')
app.use('/', userRoute)

userRoute.use('/', express.static('public/molla'))
userRoute.use('/', express.static('public'))

const adminRoute = require('./routes/adminRoute');
const { cache } = require('ejs');
app.use('/admin', adminRoute)

app.listen(3000, function () {
   console.log('Server Running');
})
