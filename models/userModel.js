const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    fname:{
        type:String,
        required:true
    },
    lname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    image:{
    type:String,
    },
    password:{
        type:String,
        required:true,
    },
    isAdmin:{
        type:Number,
        required:true
    },
    isVerified:{
        type:Number,
        default:0
    },
    coupon:[{
        type:String
    }]
});

module.exports = mongoose.model('User',userSchema);