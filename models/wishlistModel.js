const mongoose = require('mongoose')
const wishlistSchema = mongoose.Schema({
    userID:{
        type:mongoose.Types.ObjectId
    },
    product:[{
        productID:{
            type:mongoose.Types.ObjectId,
            ref:'Product'
        },
        price:{
            type:Number
        }
    }]
});

module.exports = mongoose.model('Wishlist',wishlistSchema)