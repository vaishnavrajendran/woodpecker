const mongoose = require('mongoose')
const cartSchema = mongoose.Schema({
    userID:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    product:[{
        productID:{
            type:mongoose.Types.ObjectId,
            ref:'Product'
        },
        price:{
            type:Number
        },
        quantity:{
            type:Number
        }
    }],
    totalPrice:{
        type:Number,
        default:0
    }
});

module.exports = mongoose.model('Cart',cartSchema);