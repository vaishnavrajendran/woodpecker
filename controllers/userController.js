const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Product = require('../models/productModel');
const session = require('express-session');
const Cart = require('../models/userCart')
const Order = require('../models/checkoutModel');
const checkoutModel = require('../models/checkoutModel');
const fast2sms = require('fast-two-sms')
const Category = require('../models/categoryModel')
const Wishlist = require('../models/wishlistModel')
const Coupon = require('../models/couponModel');
const Address = require('../models/addressModel')
const { render } = require('../routes/userRoute');
const { log } = require('debug/src/browser');
const { ObjectID } = require('bson');

let sess = false || {};
let USERID, randomOTP;
let coupon = {
    name: 'none',
    type: 'none',
    offer: 0,
    usedBy: false,
    used: 0
}
let couponTotal = 0;
let discountedAmount=0;

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const userLogin = (req, res) => {
    try {
        if (req.session.email)
            res.redirect('/')
        else
            res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

const userIndex = async (req, res) => {
    try {

        if (req.session.coupon) {

        } else {
            req.session.coupon = coupon;
            req.session.couponTotal = couponTotal
            req.session.discountedAmount = discountedAmount;
        }

        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        productCategories = await Product.find()
        const limit = 8

        productSearch = await Product.find({
            isVerified: 1,
            isAvailable:0,
            $or: [
                { pname: { $regex: '.*' + search + '.*', $options: 'i' } },
                { pdesc: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        }).limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        count = await Product.find({
            isVerified: 1,
            $or: [
                { pname: { $regex: '.*' + search + '.*', $options: 'i' } },
                { pdesc: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        }).countDocuments();

        let sub = 500;
        res.render('index', {
            isLoggedin:req.session.userId,
            sub: sub,
            categories: productCategories,
            product: productSearch,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        })
    } catch (error) {
        console.log(error.message);
    }

}

const userShop = async (req, res) => {
    try {
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }
        const categories = await Category.find()
        const productSearch = await Product.find({
            isVerified: 1,
            isAvailable:0,
            $or: [
                { pname: { $regex: '.*' + search + '.*', $options: 'i' } },
                { pdesc: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        });
        res.render('shop', { isLoggedin:req.session.userId, product: productSearch, category: categories })
    } catch (error) {
        console.log(error.message);
    }
}

const userDetail = async (req, res) => {
    try {
        proID: req.query.id;
        const productDetails = await Product.find({ _id: proID })
        res.render('detail', { isLoggedin:req.session.userId, product: productDetails })
    } catch (error) {
        error.message
    }
}

const userRegister = async (req, res) => {
    try {
        res.render('registration')
    }
    catch (error) {
        console.log(error.message);
    }
}

const userPostLogin = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (passwordMatch) {
            if (userData.isVerified === 0) {
                // removed otp validation
                // res.render('login', { message: "Please verify your mail" });
                req.session.userId = userData._id;
                isLoggedin = req.session.userId;
                res.redirect('/');
            } else {
                try {
                    req.session.userId = userData._id;
                    isLoggedin = req.session.userId;
                    res.redirect('/');
                } catch (error) {
                    console.log(error.message);
                }

            }
        } else {
            res.render('login', { message: "Login Failed" });
        }
    } else {
        res.render('login', { message: "Login Failed" })
    }
}

const userPostRegister = async (req, res) => {
    try {
        const userDataCheck = await User.findOne({ email: req.body.email });
        if (userDataCheck) {
            res.render('registration', { message: "Email already exists.Try other email" })
        } else {
            if (req.body.password === req.body.repassword) {
                const hashedPassword = await securePassword(req.body.password);
                const user = new User({
                    fname: req.body.fname,
                    lname: req.body.lname,
                    email: req.body.email,
                    mobile: req.body.mno,
                    password: hashedPassword,
                    isAdmin: 0
                });
                const userData = await user.save();
                req.session.userId = userData._id;
                USERID = userData._id;
                if (userData) {
                    // sendMessage(req.body.mno)
                    // res.render('otp')
                    isLoggedin = req.session.userId;
                    res.render('registration');
                } else {
                    res.render('registration', { message: "Your registration has been failed" })
                }
            } else {
                res.render('registration', { message: "Passwords not matching" })
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = (req, res) => {
    try {
        req.session.destroy();
        isLoggedin = false
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

const userCart = async (req, res) => {
    try {
        ship = 10;
        const cartFetch = await Cart.findOne(
            { userID: req.session.userId }).populate('product.productID')
        if (cartFetch) {
            productData = await Cart.findOne({ userID: req.session.userId }).populate('product.productID');
            if(productData){
                const totalPrice = productData.product.reduce((acc, curr) => {
                    return acc + (curr.productID.price * curr.quantity)
                },0);
                productData.totalPrice = totalPrice;
                await productData.save();
            }
            if (req.session.couponTotal < productData.totalPrice && req.session.couponTotal != 0 && req.session.coupon.used == 1) {
                res.render('cart', { isLoggedin:req.session.userId, cart: cartFetch.product, totalCart: req.session.couponTotal, shipping: ship,discountAmount:req.session.discountedAmount })
            } else if (req.session.couponTotal == 0) {
                req.session.couponTotal = productData.totalPrice;
                res.render('cart', { isLoggedin:req.session.userId, cart: cartFetch.product, totalCart: req.session.couponTotal, shipping: ship,discountAmount:req.session.discountedAmount})
            } else {
                req.session.couponTotal = productData.totalPrice;
                res.render('cart', { isLoggedin:req.session.userId, cart: cartFetch.product, totalCart: req.session.couponTotal, shipping: ship,discountAmount:req.session.discountedAmount })
            }
        } else {
            res.render('cart', { isLoggedin:req.session.userId, cart: '', totalCart: req.session.couponTotal, shipping: ship,discountAmount:'' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const updateQuantity = async (req, res) => {
    Id = req.query.id;
    qty = req.body.quantity;
    productData = await Cart.findOne({ userID: req.session.userId }).populate('product.productID');
    indexNum = await productData.product.findIndex(index => index._id == Id);
    productData.product[indexNum].quantity = qty;
    await productData.save();
    const forTotal = await Cart.findOne({ userID:req.session.userId })
    forTotal.totalPrice = 0;
    res.redirect('/cart');
}

const wishlist = async (req, res) => {
    try {
        const fetchWishlist = await Wishlist.findOne(
            { userID: req.session.userId }).populate('product.productID')
        if (fetchWishlist) {
            res.render('wishlist', { isLoggedin:req.session.userId, wishlist: fetchWishlist.product })
        } else {
            res.render('wishlist', { isLoggedin:req.session.userId, wishlist: '' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const productId = req.query.id
        const checkWishlist = await Wishlist.findOne({ userID: req.session.userId })
        if (checkWishlist != null) {
            const prodCheck = await Wishlist.findOne({
                userID: req.session.userId,
                'product.productID': productId
            });
            if (prodCheck != null) {
                res.json({ status: true });
            } else {
                const addItem = await Wishlist.updateOne({ userID: req.session.userId },
                    { $push: { product: { 'productID': productId } } })
                res.json({ status: true });
            }
        }
        else {
            const wishlist = new Wishlist({
                userID: req.session.userId,
                product: [{
                    productID: productId
                }]
            })
            const wishlistData = await wishlist.save();
            res.json({ status: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const userCheckout = async (req, res) => {
    try {
        ship = 10;
        const cartFetch = await Cart.findOne(
            { userID: req.session.userId }).populate('product.productID')
            addressDetails = await Address.find({userID:req.session.userId})
            id=req.query.id
            findAddress = await Address.findOne({_id:id})
        res.render('checkout', { isLoggedin:req.session.userId, cart: cartFetch.product, cartTotal: req.session.couponTotal, shipping: ship,discountAmount:req.session.discountedAmount,address:findAddress,address1:addressDetails })
    } catch (error) {
        console.log(error.message);
    }
}

const userContact = (req, res) => {
    try {
        res.render('contact', { isLoggedin })
    } catch (error) {
        console.log(error.message);
    }
}

const addToCart = async (req, res, next) => {
    try {
        const productId = req.query.id
        const checkCart = await Cart.findOne({ userID: req.session.userId })
        if (checkCart != null) {
            const prodCheck = await Cart.findOne({
                userID: req.session.userId,
                'product.productID': productId
            });

            if (prodCheck != null) {
                const increaseQuantity = await Cart.updateOne({
                    userID: req.session.userId,
                    'product.productID': productId
                },
                    { $inc: { 'product.$.quantity': 1 } })
                res.json({ status: true });

            } else {
                const pushQuantity = await Cart.updateOne({ userID: req.session.userId },
                    { $push: { product: { 'productID': productId, 'quantity': 1 } } })
                res.json({ status: true });

            }
        }
        else {
            const cart = new Cart({
                userID: req.session.userId,
                product: [{
                    productID: productId,
                    quantity: 1
                }]
            })
            await cart.save();
            res.json({ status: true });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const moveToCart = async(req,res)=>{
    try {
        const productId = req.query.id
        const checkCart = await Cart.findOne({ userID: req.session.userId })
        if (checkCart != null) {
            const prodCheck = await Cart.findOne({
                userID: req.session.userId,
                'product.productID': productId
            });

            if (prodCheck != null) {
                const increaseQuantity = await Cart.updateOne({
                    userID: req.session.userId,
                    'product.productID': productId
                },
                    { $inc: { 'product.$.quantity': 1 } })
                res.redirect('/cart')
            } else {
                const pushQuantity = await Cart.updateOne({ userID: req.session.userId },
                    { $push: { product: { 'productID': productId, 'quantity': 1 } } })
                res.redirect('/cart');
            }
        }
        else {
            const cart = new Cart({
                userID: req.session.userId,
                product: [{
                    productID: productId,
                    quantity: 1
                }]
            })
            await cart.save();
            res.redirect('/cart');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const deleteWishlist = async (req, res, next) => {
    cartProdId = req.query.id;
    const userWishlist = await Wishlist.findOne({ userID: req.session.userId })
    if (userWishlist) {
        const findProdIndex = await userWishlist.product
            .findIndex(wishlistItems => wishlistItems._id == cartProdId)
        if (findProdIndex) {
            userWishlist.product.splice(findProdIndex, 1)
            await userWishlist.save();
        }
    }
    next()
}

const userDeleteWishlist = async (req, res) => {
    userSession = req.session
    delId = req.query.id;
    const userWishlist = await Wishlist.findOne({ userID: req.session.userId })
    if (userWishlist) {
        const findProdIndex = await userWishlist.product
            .findIndex(wishlistItems => wishlistItems._id == delId);
        userWishlist.product.splice(findProdIndex, 1)
        await userWishlist.save();
        res.redirect('/wishlist');
    }
}

// const razorpayCheckout = async(req,res)=>{
//     userSession = req.session
//     const userData =await User.findById({ _id:userSession.userId })
//     const completeUser = await userData.populate('cart.item.productId')
//     var instance = new Razorpay({ key_id: 'rzp_test_0dGOmkN53nGuBg', key_secret: 'mEkJrYGMckakFAOXVahtu30g' })
//                 let order = await instance.orders.create({
//                   amount: completeUser.cart.totalPrice*100,
//                   currency: "INR",
//                   receipt: "receipt#1",
//                 })
//                 res.status(201).json({
//                     success: true,
//                     order
//                 })
// }

const deleteCart = async (req, res) => {
    cartProdId = req.query.id;
    const userCart = await Cart.findOne({ userID: req.session.userId })
    const findProdIndex = await userCart.product
        .findIndex(cartItems => cartItems._id == cartProdId);
    userCart.product.splice(findProdIndex, 1)
    await userCart.save();
    res.redirect('/cart')

}

const viewDetail = async (req, res) => {
    try {
        prodID = req.query.id;
        const productDetails = await Product.find({ _id: prodID })
        const productcarosel = await Product.find()
        res.render('detail', { isLoggedin:req.session.userId, product: productDetails, productCar: productcarosel })
    } catch (error) {
        console.log(error.message);
    }
}

const postCheckout = async (req, res) => {
    const cartData = await Cart.findOne({ userID: req.session.userId })
    const orders = new Order({
        userID: req.session.userId,
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        mno: req.body.mno,
        address1: req.body.address1,
        address2: req.body.address2,
        country: req.body.country,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        payment: req.body.payment,
        product: cartData.product,
        totalPrice: req.session.couponTotal,
        offer: req.session.coupon.name
    })
    await orders.save();
    req.session.currentOrder=orders._id;
    const order = await Order.findById({_id:req.session.currentOrder})
    const productDetails = await Product.find({isAvailable:0})
        for(let i=0;i<productDetails.length;i++){
            for(let j=0;j<order.product.length;j++){
             if(productDetails[i]._id.equals(order.product[j].productID)){
                 productDetails[i].qty+=order.product[j].quantity;
             }    
            }productDetails[i].save()
         }
    req.session.coupon.used = 0; 
    req.session.detailsAmount=req.session.discountedAmount
    req.session.discountedAmount=0;
    const userCoupon = await Coupon.updateOne({ name: req.session.coupon.name }, { $push: { usedBy: req.session.userId } })
    if (req.body.payment == 'cod') {
        const delCart = await Cart.findOneAndDelete({userID:req.session.userId})
        await Order.findOneAndUpdate({ userID: req.session.userId }, { status: 'billed' })
        const orderData = await Order.findOne({_id:req.session.currentOrder }).populate('product.productID')
        const forTotal = await Order.findOne({ userID: req.session.userId })
        const addressFetch = await Order.findOne({_id:req.session.currentOrder })
        res.render('orderPlaced', { cart: orderData.product, totalprice: req.session.couponTotal,discountAmount:req.session.detailsAmount,address:addressFetch })
    } else if (req.body.payment == 'paypal') {
        const delCart = await Cart.findOneAndDelete({userID:req.session.userId})
        res.redirect('/paypal')
    }

}

const ordersuccesful = async (req, res) => {
    const orderData = await Order.findOne({ userID: req.session.userId }).populate('product.productID')
    const forTotal = await Order.findOne({ userID: req.session.userId })
    res.render('orderplaced', { cart: orderData.product, totalprice: req.session.couponTotal,discountAmount:req.session.detailsAmount})
}

const paypal = async (req, res) => {
    req.session.discountedAmount=0;
    const orderData = await Order.findOne({ userID: req.session.userId })
    res.render('paypal', { total:req.session.couponTotal  })
}

const userDashboard = async (req, res) => {
    productDetails = await Product.find({ _id: req.session.userId })
    userDetails = await User.find({ _id: req.session.userId })
    orderDetail = await checkoutModel.find({ userID: req.session.userId })
    addressDetails = await Address.find({userID:req.session.userId})
    res.render('userDashboard', { isLoggedin:req.session.userId, order: orderDetail, user: userDetails, product: productDetails,address:addressDetails })
}

const orderDetails = async (req, res) => {
    const orderId = req.query.id
    cartDetails = await Order.findOne({ _id: orderId }).populate('product.productID')
    fetchAddress = await Order.findById({_id:orderId})
    res.render('orderDetails', { cart: cartDetails.product, totalPrice:fetchAddress,address:fetchAddress})
}

const sendMessage = function (mobile, res) {
    randomOTP = Math.floor(Math.random() * 10000)
    var options = {
        authorization: 'MSOj0bTnaP8phCARmWqtzkgEV4ZN2Ff9eUxXI7iJQ5HcDBKsL1vYiamnRcMxrsjDJboyFEXl0Sk37pZq',
        message: `Your OTP verification code is ${randomOTP}`,
        numbers: [mobile]
    }

    fast2sms.sendMessage(options)
        .then((response) => {
            console.log("OTP sent succcessfully")
        }).catch((error) => {
            console.log(error)
        })
    return randomOTP;
}

const validateUser = async (req, res) => {
    const otp = req.body.otp;
    if (otp == randomOTP) {
        const validateUser = await User.findById({ _id: USERID })
        validateUser.isVerified = 1;
        const test = await validateUser.save()
        if (test) {
            res.redirect('/');
            
        } else {
            res.render('registration', { message: "Invalid OTP" })
        }
    }
}

const orderConfirmation = (req,res)=>{
    res.render('thankyou');
}

const selCategories = async (req, res) => {
    const productData = await Product.find({ pcat: req.query.category })
    const categories = await Category.find()
    res.render('shop', { product: productData, isLoggedin:req.session.userId, category: categories })
}

const addCoupon = async (req, res) => {
    try {
        couponApplied = req.query.offer;
        if (req.session.userId) {
            userData = await User.findById({ _id: req.session.userId });
            offerData = await Coupon.findOne({ name: couponApplied });
            if (offerData) {
                if (offerData.usedBy != req.session.userId) {
                    req.session.coupon.name = offerData.name;
                    req.session.coupon.type = offerData.type;
                    req.session.coupon.offer = offerData.offer;
                    req.session.coupon.used = 1;
                    fetchCart = await Cart.findOne({ userID: req.session.userId });
                    const updatedPrice = fetchCart.totalPrice - ((fetchCart.totalPrice * req.session.coupon.offer) / 100);
                    req.session.discountedAmount = fetchCart.totalPrice-updatedPrice;
                    req.session.couponTotal = updatedPrice;
                    res.redirect('/cart')
                } else {
                    req.session.coupon.usedBy = true;
                    res.redirect('/cart');
                }
            } else {
                res.redirect('/cart')
            }
        } else {
            res.redirect('/cart')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const returnOrder = async(req,res)=>{
    id=req.query.id;
    const orderDetails = await Order.findByIdAndUpdate({_id:id},{$set:{status:'returnPending'}})
    orderDetails.save();
    res.redirect('/userDashboard')
}

const cancelOrder = async(req,res)=>{
    try {
        id=req.query.id;
        const orderData= await Order.deleteOne({_id:id})
        res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
    }
}

const addAddress = async(req,res)=>{
    try {
        const address = new Address({
            userID:req.session.userId,
            fname:req.body.fname,
            lname:req.body.lname,
            email:req.body.email,
            mno:req.body.mno,
            address1:req.body.address,
            address2:req.body.address2,
            country:req.body.country,
            city:req.body.city,
            state:req.body.state,
            zip:req.body.zip
        })
        await address.save();
        res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    securePassword,
    userIndex,
    userShop,
    userRegister,
    userPostLogin,
    userLogin,
    userPostRegister,
    userLogout,
    userCart,
    userCheckout,
    userContact,
    addToCart,
    deleteCart,
    viewDetail,
    updateQuantity,
    postCheckout,
    ordersuccesful,
    paypal,
    userDashboard,
    orderDetails,
    validateUser,
    selCategories,
    wishlist,
    addToWishlist,
    deleteWishlist,
    addCoupon,
    userDeleteWishlist,
    userDetail,
    returnOrder,
    orderConfirmation,
    moveToCart,
    cancelOrder,
    addAddress
}
