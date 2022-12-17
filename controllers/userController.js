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
const { render } = require('../routes/userRoute');

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

        // userSession = req.session;
        if (req.session.coupon) {

        } else {
            req.session.coupon = coupon;
            req.session.couponTotal = couponTotal
        } console.log('index');

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
            isLoggedin,
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
            $or: [
                { pname: { $regex: '.*' + search + '.*', $options: 'i' } },
                { pdesc: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        });
        res.render('shop', { isLoggedin, product: productSearch, category: categories })
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
                res.render('login', { message: "Please verify your mail" });
            } else {
                try {
                    req.session.userId = userData._id;
                    // userSession = req.session
                    // userSession.userId = userData._id;
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
                    sendMessage(req.body.mno)
                    res.render('otp')
                    isLoggedin = req.session.userId;
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
        // userSession = req.session;
        ship = 10;
        const cartFetch = await Cart.findOne(
            { userID: req.session.userId }).populate('product.productID')
        if (cartFetch) {
            productData = await Cart.findOne({ userID: req.session.userId }).populate('product.productID');
            const totalPrice = productData.product.reduce((acc, curr) => {
                return acc + (curr.productID.price * curr.quantity)
            }, 0);
            productData.totalPrice = totalPrice;
            await productData.save();
            if (req.session.couponTotal < productData.totalPrice && req.session.couponTotal != 0 && req.session.coupon.used == 1) {
                req.session.coupon.used = 0;
                res.render('cart', { isLoggedin, cart: cartFetch.product, totalCart: req.session.couponTotal, shipping: ship })
            } else if (req.session.couponTotal == 0) {
                req.session.couponTotal = productData.totalPrice;
                res.render('cart', { isLoggedin, cart: cartFetch.product, totalCart: req.session.couponTotal, shipping: ship })
            } else {
                req.session.couponTotal = productData.totalPrice;
                console.log('userr', req.session.couponTotal);
                res.render('cart', { isLoggedin, cart: cartFetch.product, totalCart: req.session.couponTotal, shipping: ship })
            }
        } else {
            console.log('none');
            res.render('cart', { isLoggedin, cart: '', totalCart: req.session.couponTotal, shipping: ship })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const updateQuantity = async (req, res) => {
    Id = req.query.id;
    // userSession = req.session;
    qty = req.body.quantity;
    console.log(qty);
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
        // userSession = req.session;
        const fetchWishlist = await Wishlist.findOne(
            { userID: req.session.userId }).populate('product.productID')
        if (fetchWishlist) {
            res.render('wishlist', { isLoggedin, wishlist: fetchWishlist.product })
        } else {
            console.log('none1');
            res.render('wishlist', { isLoggedin, wishlist: '' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const addToWishlist = async (req, res) => {
    try {
        const productId = req.query.id
        // userSession = req.session
        const checkWishlist = await Wishlist.findOne({ userID: req.session.userId })
        if (checkWishlist != null) {
            const prodCheck = await Wishlist.findOne({
                userID: req.session.userId,
                'product.productID': productId
            });
            if (prodCheck != null) {
                // const increaseQuantity = await Cart.updateOne({
                //     userID:userSession.userId,
                //     'product.productID':productId},
                //     {$inc:{'product.$.quantity':1}})
                res.redirect('/');
            } else {
                const addItem = await Wishlist.updateOne({ userID: req.session.userId },
                    { $push: { product: { 'productID': productId } } })
                res.redirect('/');
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
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const userCheckout = async (req, res) => {
    try {
        // userSession = req.session;
        ship = 10;
        // const forTotal = await Cart.findOne({userID:userSession.userId})
        const cartFetch = await Cart.findOne(
            { userID: req.session.userId }).populate('product.productID')
        res.render('checkout', { isLoggedin, cart: cartFetch.product, cartTotal: req.session.couponTotal, shipping: ship })
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
        // userSession = req.session
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
                res.redirect('/')

            } else {
                const pushQuantity = await Cart.updateOne({ userID: req.session.userId },
                    { $push: { product: { 'productID': productId, 'quantity': 1 } } })
                res.redirect('/');

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
            res.redirect('/');

        }

    } catch (error) {
        console.log(error.message);
    }
}

const deleteWishlist = async (req, res, next) => {
    cartProdId = req.query.id;
    // userSession = req.session;
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
    console.log(userWishlist);
    if (userWishlist) {
        const findProdIndex = await userWishlist.product
            .findIndex(wishlistItems => wishlistItems._id == delId);
        userWishlist.product.splice(findProdIndex, 1)
        await userWishlist.save();
        res.redirect('/wishlist');
    }
}

const deleteCart = async (req, res) => {
    cartProdId = req.query.id;
    // userSession = req.session;
    const userCart = await Cart.findOne({ userID: req.session.userId })
    console.log('userCart', userCart);
    const findProdIndex = await userCart.product
        .findIndex(cartItems => cartItems._id == cartProdId);
    console.log(findProdIndex);
    userCart.product.splice(findProdIndex, 1)
    await userCart.save();
    res.redirect('/cart')

}

const viewDetail = async (req, res) => {
    try {
        prodID = req.query.id;
        const productDetails = await Product.find({ _id: prodID })
        const productcarosel = await Product.find()
        res.render('detail', { isLoggedin, product: productDetails, productCar: productcarosel })
    } catch (error) {
        console.log(error.message);
    }
}

const postCheckout = async (req, res) => {
    // userSession = req.session
    const cartData = await Cart.findOne({ userID: req.session.userId })
    console.log(req.session.couponTotal);
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
    await orders.save()
    console.log(req.session.couponTotal);
    const userCoupon = await Coupon.updateOne({ name: req.session.coupon.name }, { $push: { usedBy: req.session.userId } })
    if (req.body.payment == 'cod') {
        await Order.findOneAndUpdate({ userID: req.session.userId }, { status: 'billed' })
        const orderData = await Order.findOne({ userID: req.session.userId }).populate('product.productID')
        const forTotal = await Order.findOne({ userID: req.session.userId })
        res.render('orderPlaced', { cart: orderData.product, totalprice: req.session.couponTotal })
    } else if (req.body.payment == 'paypal') {
        res.redirect('/paypal')
    }
}

const ordersuccesful = async (req, res) => {
    // userSession = req.session
    const delCart = await Cart.findOneAndDelete({userID:req.session.userId})
    const orderData = await Order.findOne({ userID: req.session.userId }).populate('product.productID')
    const forTotal = await Order.findOne({ userID: req.session.userId })
    res.render('orderplaced', { cart: orderData.product, totalprice: req.session.couponTotal })
}

const paypal = async (req, res) => {
    // userSession = req.session
    const orderData = await Order.findOne({ userID: req.session.userId })
    res.render('paypal', { total:req.session.couponTotal  })
}

const userDashboard = async (req, res) => {
    // userSession = req.session
    productDetails = await Product.find({ _id: req.session.userId })
    userDetails = await User.find({ _id: req.session.userId })
    orderDetail = await checkoutModel.find({ userID: req.session.userId })
    res.render('userDashboard', { isLoggedin, order: orderDetail, user: userDetails, product: productDetails })
}

const orderDetails = async (req, res) => {
    // userSession = req.session
    const orderId = req.query.id
    cartDetails = await Order.findOne({ _id: orderId }).populate('product.productID')
    // forTotal = await Order.findOne({ _id: orderId })
    console.log(req.session.couponTotal);
    res.render('orderDetails', { cart: cartDetails.product, totalPrice:req.session.couponTotal })
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
            isLoggedin = true;
        } else {
            res.render('registration', { message: "Invalid OTP" })
        }
    }
}

const selCategories = async (req, res) => {
    const productData = await Product.find({ pcat: req.query.category })
    const categories = await Category.find()
    res.render('shop', { product: productData, isLoggedin, category: categories })
}

const addCoupon = async (req, res) => {
    try {
        // userSession = req.session;
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
    userDetail
}
