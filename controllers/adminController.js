const User = require('../models/userModel');
const Product = require('../models/productModel')
const bcrypt = require('bcrypt');
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { findById } = require('../models/userModel');
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const Category = require('../models/categoryModel')
const Order = require('../models/checkoutModel')
const Coupon = require('../models/couponModel');
const { orderDetails } = require('./userController');



// const storage = multer.diskStorage({
//     destination: './public/productImages',
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({
//     storage: storage
// }).fields([{ name: 'pimage',maxCount:3}])

let storage= multer.diskStorage({
    destination:function(req,files,cb){
        cb(null,'public/productImages')
    },
    filename:function(req,file,cb){
        let ext = path.extname(file.originalname)
        cb(null,file.fieldname +'-' +Date.now() + ext)
    }
})
const store= multer({storage:storage})

// const storage = multer.diskStorage({
//     destination: './public/productImages',
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({
//     storage: storage
// }).array('pimage[]');



const securePassword = async(password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const adminHome = async(req,res) => {
    try {
        if (req.session.adminId) {
        categoryData = await Category.find()
        let categoryNames = [];
        let categoryCount = [];
        for(let key of categoryData){
            categoryNames.push(key.categories);
            categoryCount.push('0');
        }
        let orderHistory = [];
        orderDetail = await Order.find()
        for(let key of orderDetail){
            let populatedDetails = await key.populate('product.productID')
            orderHistory.push(populatedDetails)
        }
        for(let i=0;i<orderDetail.length;i++){
            for(let j=0;j<orderDetail[i].product.length;j++){
                    let fetchedCategory = orderDetail[i].product[j].productID.pcat;
                    let isExisting = categoryNames.findIndex(category =>{
                    return category === fetchedCategory;
                })
                categoryCount[isExisting]++
            }
        }
        console.log(categoryNames);
        console.log(categoryCount);
        console.log(typeof(categoryNames));
        console.log(typeof(categoryCount));
        res.render('adminPage',{isLoggedin:req.session.adminId,name:categoryNames,count:categoryCount})
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const adminPage =(req,res) => {
    try {
        res.render('adminPage',{isLoggedin:req.session.adminId})
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogin = (req,res) => {
    try {
        if(req.session.adminId){
            res.redirect('/admin')
        }else{
            res.render('adminlogin',{ isLoggedin:req.session.adminId })
        }
    } catch (error) {
        console.log(error.message);
    }
    
}

const adminPost = async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email })
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.isAdmin === 0) {
                    res.render('adminlogin', { message: "Email and password is incorrect" })
                } else {
                    userSession=req.session;
                    // userSession.userId=userData._id;
                    req.session.adminId=userData._id;
                    console.log(req.session.adminId, "22");
                    isLoggedin = req.session.adminId;
                    res.redirect('/admin')
                }
            } else {
                res.render('adminlogin')
            }
        } else {
            res.render('adminlogin')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogout = (req,res) => {
    try {
        req.session.destroy();
        
        res.redirect('/admin/login');
    } catch (error) {
        console.log(error.message);
    }
}

const adminAddProducts = async(req,res) => {
    try {
        if (req.session.adminId) {
            res.render('addProducts',{isLoggedin:req.session.adminId})
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const adminEditUser = async(req,res) => {

    if (req.session.adminId) {
        const userData = await User.find({ isAdmin: 0 });
        res.render('editUser', { isLoggedin:req.session.adminId,user: userData })
    } else {
        res.redirect('/')
    }
}

const adminBlockUser = async(req,res) => {
    const id = req.query.id
    const userData = await User.findById({ _id: id })
    if (userData.isVerified) {
        await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 0 } })
    }
    else {
        await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 1 } })
    }
    res.redirect('/admin/editUser')
}

const adminPostAddProducts = async(req,res) => {
    try {
        const files = req.files;
        if(!files){
            const error = new Error('Please choose file')
            error.httpStatusCode = 400
            return next(error)
        }
        const product = Product({
            pname: req.body.pname,
            price: req.body.pprice,
            pdesc: req.body.pdesc,
            pimage: req.files[0] && req.files[0].filename ? req.files[0].filename:"",
            pimage2: req.files[0] && req.files[0].filename ? req.files[0].filename:"",
            pquantity: req.body.pquantity
        })
        const productData = await product.save();
        if (productData) {
            res.render('addProducts', { isLoggedin:req.session.adminId,message: "Product added" })
        } else {
            res.render('addProducts', {isLoggedin:req.session.adminId, message: "Failed to add" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const adminManageProducts = async(req,res) => {
    try {
        let search='';
        if(req.query.search){
            search = req.query.search;
        }
        const productpass = await Product.find({
            isAdmin:0,
            $or:[
                {pname:{ $regex:'.*'+search+'.*',$options:'i'}},
                {pprice:{ $regex:'.*'+search+'.*',$options:'i'}},
                {pdesc:{ $regex:'.*'+search+'.*',$options:'i'}}
            ]
        });
        res.render('adminProductList', { isLoggedin:req.session.adminId,product: productpass })
    } catch (error) {
        console.log(error.message);
    }
}

const adminEditProducts = async(req,res)=>{
    try {
        const id = req.query.id;
        const productData = await Product.findById({_id:id})
        res.render('editProduct',{isLoggedin:req.session.adminId,product:productData})
    } catch (error) {
        console.log(error.message);
    }
}

const adminUpdateProduct  = async(req,res)=>{
    try {
        const updatedData = await Product.findByIdAndUpdate(
                {_id:req.body.id},
                {$set:{pname:req.body.pname,
                price:req.body.price,
                pdesc:req.body.pdesc,
                pimage : req.files[0] && req.files[0].filename ? req.files[0].filename:"",
                pimage2 : req.files[1] && req.files[1].filename ? req.files[1].filename:"",
                pquantity:req.body.pquantity}})
                console.log(updatedData);
        res.redirect('/admin/manageProducts')
    } catch (error) {
        console.log(error.message);
    }
}

const deleteProduct = async(req,res)=>{
    try {
        const id = req.query.id;
        await Product.deleteOne({_id:id})
        res.redirect('/admin/manageProducts')
    } catch (error) {
        console.log(error.message);
    }
}

const manageCategories = async(req,res)=>{
    const categories= await Category.find()
    res.render('categoryManager',{category:categories})
}

const addCategory = async(req,res)=>{
    const categories= await Category.find()
    const category = new Category({
       categories:req.body.category
    })
     const saved=await category.save()
     if(saved){
        res.redirect('/admin/addcategories')
     }
}

const deleteCategory = async(req,res)=>{
    userSession:req.session;
    await Category.findByIdAndDelete({_id:req.query.id})
    res.redirect('/admin/addcategories')
}

const orderManager = async (req, res) => {

    try {
        const qstatus=req.query.id
        const Orders = await Order.find()
        res.render('orderManager', {isLoggedin:req.session.userId,orders:Orders, orderStatus:qstatus})
    } catch (error) {
        console.log(error.message);
    }

}

const viewDetails = async(req,res)=>{
    try {
        orderId = req.query.id;
        const fetchOrderDetails = await Order.findById({_id:orderId}).populate('product.productID')
        const orderDetail = await Order.findOne({_id:req.query.id})
        res.render('userOrderDetails',{order:fetchOrderDetails.product,totalPrice:orderDetail})
    } catch (error) {
        console.log(error.message);
    }
}

const confirmOrder= async(req,res)=>{
    const id=req.query.id
   const orderData= await Order.findById({_id:id})
   orderData.status="confirmed"
   await orderData.save();
   res.redirect('/admin/ordermanager')
}

const deliverOrder= async(req,res)=>{
    const id=req.query.id
   const orderData= await Order.findById({_id:id})
   orderData.status="delivered"
   await orderData.save();
   res.redirect('/admin/ordermanager')
}

const deleteOrder = async(req,res)=>{
   await Order.findByIdAndDelete({_id:req.query.id})
   res.redirect('/admin/ordermanager')
}

const addCoupon = (req,res)=>{
    res.render('createCoupon')
}

const postCoupon = async(req,res)=>{
    const coupon = Coupon({
        name:req.body.name,
        type:req.body.type,
        offer:req.body.offer
    });
    await coupon.save();
    res.redirect('/admin/manageCoupon')
}

const manageCoupon = async(req,res)=>{
    couponData = await Coupon.find()
    res.render('couponList',{coupon:couponData})
}

const confirmReturn = async(req,res)=>{
    const id=req.query.id
   const orderData= await Order.findById({_id:id})
   orderData.status="returned"
   await orderData.save();
   res.redirect('/admin/ordermanager')
}

module.exports = {
    // upload,
    store,
    adminHome,
    adminPage,
    adminPost,
    adminLogin,
    adminLogout,
    adminEditUser,
    deleteProduct,
    adminBlockUser,
    adminAddProducts,
    adminEditProducts,
    adminUpdateProduct,
    adminManageProducts,
    adminPostAddProducts,
    addCategory,
    deleteCategory,
    manageCategories,
    deleteOrder,
    deliverOrder,
    confirmOrder,
    orderManager,
    postCoupon,
    addCoupon,
    manageCoupon,
    viewDetails,
    confirmReturn,
    
}