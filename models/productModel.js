const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    pname:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        // required:true
    },
    pdesc:{
        type:String,
        required:true
    },
    pcat:{
        type:String,
        
    },
    pimage:{
        type:String,
        required:true
    },
    pimage2:{
        type:String,
        required:true
    },
    pquantity:{
        type:String,
        required:true
    },
})
module.exports = mongoose.model('Product',productSchema)
