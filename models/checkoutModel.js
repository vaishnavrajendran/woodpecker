const mongoose = require('mongoose')

const checkoutSchema = mongoose.Schema({
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
       
    },
    payment:{
        type:String,

    },
    status:{
        type:String,
        default:'pending'
    },
    totalPrice:{
        type:Number,
        default:0,
    },
    product:[{
        productID:{
            type:mongoose.Types.ObjectId,
            ref:'Product'
        },
        checkoutPrice:{
            type:Number
        },
        quantity:{
            type:Number
        }
    }],
    createdAt:{
        type:Date,
        immutable:true,
        default:()=>Date.now()
    },
    offer:{
        type:String
    }
    
})
module.exports = mongoose.model('Order',checkoutSchema);