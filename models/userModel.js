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
    //required:true     
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

// userSchema.methods.addToCart = function (product) {
//     const cart = this.cart
//     const isExisting = cart.item.findIndex(objInItems => {
//         return new String(objInItems.productId).trim() == new String(product._id).trim()
//     })
//     if(isExisting >=0){
//         cart.item[isExisting].qty +=1
//     }else{
//         cart.item.push({productId:product._id,
//         qty:1})
//     }
//     cart.totalPrice += product.price
//     console.log("User in schema:",this);
//     return this.save()
// }

module.exports = mongoose.model('User',userSchema);