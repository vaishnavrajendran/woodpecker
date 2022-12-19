const express = require('express')
const userController = require('../controllers/userController')
const userRoute = express()
const path = require('path')
const auth = require('../middlewares/auth');

const config = require('../config/config')
const session = require('express-session')
userRoute.use(session({secret:config.sessionSecret}))


userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/users')

userRoute.use(express.json())
userRoute.use(express.urlencoded({extended:true}))

let isLoggedin
isLoggedin = false

userRoute.get('/',userController.userIndex)

userRoute.get('/shop',userController.userShop)

userRoute.get('/detail',userController.userDetail)

userRoute.get('/register',auth.isLogout,userController.userRegister)

userRoute.get('/login',auth.isLogout,userController.userLogin)

userRoute.post('/login',userController.userPostLogin)

userRoute.post('/register',userController.userPostRegister)

//userRoute.get('/home',userController.userHome)

userRoute.get('/logout',userController.userLogout)

userRoute.get('/cart',auth.isLogin,userController.userCart)

userRoute.get('/checkout',userController.userCheckout)

userRoute.get('/contact',userController.userContact)

userRoute.get('/addToCart',auth.isLogin,userController.addToCart)

userRoute.post('/deleteCart',userController.deleteCart)

userRoute.get('/viewDetail',userController.viewDetail)

userRoute.post('/updateQuantity',userController.updateQuantity)

userRoute.post('/postCheckout',userController.postCheckout)

userRoute.get('/orderPlaced',userController.ordersuccesful)

userRoute.get('/paypal',userController.paypal)

userRoute.get('/userDashboard',userController.userDashboard)

userRoute.post('/orderDetails',userController.orderDetails)

userRoute.post('/otp-validation',userController.validateUser)

userRoute.get('/sel-categories',userController.selCategories)

userRoute.get('/wishlist',auth.isLogin,userController.wishlist)

userRoute.get('/addToWishlist',userController.addToWishlist)

userRoute.get('/moveToCart',userController.deleteWishlist,userController.moveToCart)

userRoute.get('/addCoupon',userController.addCoupon)

userRoute.get('/userDeleteWishlist',userController.userDeleteWishlist)

userRoute.post('/returnOrder',userController.returnOrder)

userRoute.get('/thanks',userController.orderConfirmation)

module.exports = userRoute
