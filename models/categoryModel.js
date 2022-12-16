const mongoose=require('mongoose')

const categorySchema= new mongoose.Schema({
  categories:{
    type:String,
  }
})

module.exports= mongoose.model('Category', categorySchema)