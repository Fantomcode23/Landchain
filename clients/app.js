const express=require('express');
const app=express();
const path=require('path');
const port=8080;
const ejsmate=require("ejs-mate");
const methodoverride=require('method-override');
app.set('view engine','ejs');
app.set('views',path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname,'/public')));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.engine('ejs',ejsmate);
app.use(methodoverride("_method"));
app.listen(port,()=>{
    console.log(`Listening on port ${port}`);
});

app.get('/',async (req,res)=>{
    
    res.render('listings/govtauthdetails.ejs');
});
app.get('/ownerdetails',(req,res)=>{
    res.render('listings/ownerdetails.ejs');
});
app.get('/userdetails',(req,res)=>{
    res.render('listings/userdetails.ejs');
});
app.post('/gotownerdetails',(req,res)=>{
    let ownerdetails=req.body;
    res.render('listings/owner.ejs',{ownerdetails});
});
app.post('/gotuserdetails',(req,res)=>{
    let userdetails=req.body;
    res.render('listings/buyer.ejs',{userdetails});
});
app.get('/owner/32',(req,res)=>{
    res.render('listings/showpropowner.ejs');
})
app.get("/user/64",(req,res)=>{
    res.render('listings/showpropuser.ejs');
});
const ethers=require('ethers');
