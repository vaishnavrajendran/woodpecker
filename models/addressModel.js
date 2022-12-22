const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    userID:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    fname:{
        type:String,
    },
    lname:{
        type:String,
    },
    email:{
        type:String,
    },
    mno:{
        type:Number,
    },
    address1:{
        type:String,
    },
    address2:{
        type:String,
    },
    country:{
        type:String,
    },
    city:{
        type:String,

    },
    state:{
        type:String,
       
    },
    zip:{
        type:Number,
       
    }
})

module.exports= mongoose.model('Address', addressSchema)