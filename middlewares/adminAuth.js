
const isAdminLogin = async(req,res,next)=>{
    try {
        if(req.session.adminId){
            next();
        }
        else{
        res.redirect('/admin/login')
    }
    } catch (error) {
        console.log(error.message);
    }    
}

const isAdminLogout = async(req,res,next)=>{
    try {
        if(req.session.adminId){
            res.redirect('/admin')
        }else{
            next();
        }
     
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    isAdminLogin,
    isAdminLogout
}