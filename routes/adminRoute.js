const express = require('express')
const adminRoute = express()
const adminController = require('../controllers/adminController')
const session = require('express-session')
const userRoute = require('./userRoute')
const adminAuth = require('../middlewares/adminAuth')
require('dotenv').config();

adminRoute.set('view engine', 'ejs')
adminRoute.set('views', './views/admin')
adminRoute.use('/', express.static('public'))

adminRoute.use(session({ secret: process.env.sessionSecret }))

adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }))


adminRoute.get('/', adminController.adminHome)

adminRoute.get('/login',adminAuth.isAdminLogout,adminController.adminLogin)

adminRoute.post('/login',adminController.adminPost)

adminRoute.get('/logout',adminController.adminLogout)

adminRoute.get('/adminPage', adminController.adminPage)

adminRoute.get('/addProducts',adminController.adminAddProducts)

adminRoute.post('/addProducts',adminController.store.any(),adminController.adminPostAddProducts)

adminRoute.get('/editUser',adminController.adminEditUser)

adminRoute.get('/block-user',adminController.adminBlockUser)

adminRoute.get('/manageProducts',adminController.adminManageProducts)

adminRoute.get('/editProduct',adminController.adminEditProducts)

adminRoute.post('/editProduct',adminController.store.any(),adminController.adminUpdateProduct)

adminRoute.get('/deleteProduct',adminController.deleteProduct)

adminRoute.get('/addcategories',adminController.manageCategories)

adminRoute.post('/addcategory', adminController.addCategory)

adminRoute.post('/delcategory',adminController.deleteCategory)

adminRoute.get('/cat-sel?id=all', adminController.orderManager)

adminRoute.post('/confirm-order', adminController.confirmOrder)

adminRoute.post('/delete-order', adminController.deleteOrder)

adminRoute.post('/deliver-order', adminController.deliverOrder)

adminRoute.get('/cat-sel', adminController.orderManager)

adminRoute.get('/addCoupon',adminController.addCoupon)

adminRoute.post('/postCoupon',adminController.postCoupon)

adminRoute.get('/manageCoupon',adminController.manageCoupon)

adminRoute.post('/order-details',adminController.viewDetails)

adminRoute.post('/confirm-return',adminController.confirmReturn)

adminRoute.get('/salesReport',adminController.salesReport)

module.exports = adminRoute
