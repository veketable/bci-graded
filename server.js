const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({dest: 'images/' })
const express = require('express')
const bodyParser = require('body-parser');
const passport = require('passport')
const BasicStrategy = require('passport-http').BasicStrategy
const app = express()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const Ajv = require('ajv')
const ajv = new Ajv()
const postInfoSchema = require('./schemas/postInfoSchema.schema.json')
const getInfoSchema = require('./schemas/getInfoSchema.schema.json')
const userRegistrationSchema = require('./schemas/userRegisterSchema.schema.json')
const findPostSchema = require('./schemas/findPostSchema.schema.json')
const putPostSchema = require('./schemas/putPostSchema.schema.json')
const jwtSecretKey = "reallySecretKey"
var cloudinary = require('cloudinary')
var cloudinaryStorage = require('multer-storage-cloudinary')
const path = require('path')
//const port = 3000

//cloudinary folder config
cloudinary.config({ 
    cloud_name: 'dzt0wh5as', 
    api_key: '968542668164727', 
    api_secret: 'LRPuyJJORC54Y8OVj0Fx4E9alCE' 
  });

var storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: '',
    allowedFormats: ['jpg', 'png']
})

var parser = multer ({storage: storage})

//validators for schemas
const postInfoValidator = ajv.compile(postInfoSchema)
const userRegistrationgValidator = ajv.compile(userRegistrationSchema)
const getInfoValidator = ajv.compile(getInfoSchema)
const findPostValidator = ajv.compile(findPostSchema)
const putPostValidator = ajv.compile(putPostSchema)

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 80))

const salt = bcrypt.genSaltSync(6)
const testHashed = bcrypt.hashSync("admin", salt)

let userDb = [{
    userID: uuidv4(),
    username: "admin",
    password: testHashed,
    email: "admin.admin@gmail.com",
    phone: "1234"
}]
let posts = []


passport.use(new BasicStrategy(
    (username, password, done) => {
        //search userDb for matching user       
        const searchResut = userDb.find(user =>  {
            if (user.username === username) {
                if(bcrypt.compareSync(password, user.password)){
                    return true;
                }
            }
            return false;
        })

        if(searchResut != undefined) {
            done(null, searchResut) //successfully authenticated
        }else{
            done(null,false)//no credential match
        }
    }
))


//register user
app.post('/userSignup', upload.none() , (req, res) => {

    const validationResult = userRegistrationgValidator(req.body)

    if(req.body.username != null && req.body.password != null && req.body.email != null && req.body.phone){
        if(userDb.find(user => user.username == req.body.username) || userDb.find(user => user.email == req.body.email) || userDb.find(user => user.phone == req.body.phone)){
            res.sendStatus(409)
            
        }else if(req.body.username.length > 0 && req.body.password.length > 0 && req.body.email.length >0 && req.body.phone.length > 0){
            const salt = bcrypt.genSaltSync(6)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)
        
            const newUser ={
                userID: uuidv4(),
                username: req.body.username,
                password: hashedPassword,
                email: req.body.email,
                phone: req.body.phone
            }
            userDb.push(newUser)
            res.sendStatus(201)
        }else{
            res.sendStatus(400)
        }
    }else{
        res.sendStatus(400)
    }
})


const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecretKey
}

passport.use(new JwtStrategy(options, (payload, done) => {
    //pass the control to the handler methods
    done(null, {})

}))

//user login
app.post('/userLogin', passport.authenticate('basic', {session: false}), (req, res) => {

    
    const user = (req.headers.authorization).split(' ')
    var s = new Buffer.from(user[1], 'base64')
    const userUTF = s.toString()
    const username = userUTF.split(':')

    const searchResut = userDb.find(user =>  {
        if (user.username === username[0]) {
            return true;
        }
        return false;
    })

    const contacts = {
        userID: searchResut.userID,
        username: searchResut.username,
        email: searchResut.email,
        phone: searchResut.phone
    }

    //create a JWT for the client
    const token = jwt.sign(contacts, jwtSecretKey)


    //send the JWT to the clien
    res.json({token: token})

})

//create new posting
app.post('/posting', passport.authenticate('jwt', {session: false}), parser.array('photos'), (req, res) => {

    const validationResult = postInfoValidator(req.body)
    var today = new Date()
    var date = today.getDate()+'.'+(today.getMonth()+1)+'.'+today.getFullYear()
    const payload = (req.headers.authorization).split('.')
    var s = new Buffer.from(payload[1], 'base64')
    const allOFContact = s.toString()
    var contactFinal = JSON.parse(allOFContact)
    delete contactFinal.iat
    const user = userDb.find(u => u.userID == contactFinal.userID)
    var images = []
    if(user != undefined){
        if(validationResult == true){
            if(req.files != null){
                if(req.files.length < 5){
                    images = req.files
                }else{
                    res.sendStatus(400)
                }
            }
        const newPost ={
            id: uuidv4(),
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            location: req.body.location,
            image: images,
            price: req.body.price,
            date: date,
            delivery: req.body.delivery,
            contacts: contactFinal
        }
        res.sendStatus(201)
        
        
        posts.push(newPost)
        console.log(posts)
        }else {
            res.sendStatus(400)
        }
        
    }else{
        res.sendStatus(401)
    }
    
    
    
})

//get every posting or search for posting
app.get('/posting', (req, res) => {

    const validationResult = findPostValidator(req.body)
    if(validationResult == true) {
        if(posts.length == 0){
            res.sendStatus(404)
        }else if (req.body.constructor === Object && Object.keys(req.body).length === 0){
            res.json(posts)
        }else if (req.body.category != null || req.body.location != null || req.body.date != null){
            var post = undefined
            if (req.body.category != null && req.body.location != null && req.body.date != null) {
                post = posts.filter(p => p.category == req.body.category && p.location == req.body.location && p.date == req.body.date)
    
            } else if (req.body.category != null && req.body.location != null && req.body.date == null) {
                post = posts.filter(p => p.category == req.body.category && p.location == req.body.location)
    
            } else if (req.body.category != null && req.body.date != null && req.body.location == null) {
                post = posts.filter(p => p.category == req.body.category && p.date == req.body.date)
    
            } else if (req.body.location != null && req.body.date != null && req.body.category == null) {
                post = posts.filter(p => p.location == req.body.location && p.date == req.body.date)
    
            } else if (req.body.category != null && req.body.location == null && req.body.date == null) {
                post = posts.filter(p => p.category == req.body.category)
    
            } else if (req.body.category == null && req.body.location != null && req.body.date == null) {
                post = posts.filter(p => p.location == req.body.location)
    
            } else if (req.body.category == null && req.body.location == null && req.body.date != null) {
                post = posts.filter(p => p.date == req.body.date)
    
            }
            if(post.length == 0) {
                res.sendStatus(404)
            }else {
                const validationResult = getInfoValidator(post)
                if (!validationResult) {
                    console.log(getInfoValidator.errors)
                }else {
                    res.json(post)
                }
            }    
        }else{
            res.sendStatus(404)
        }
    }else{
        res.sendStatus(400)
    }
           
})

//edit posting but posting id
app.put('/posting/:id', passport.authenticate('jwt', {session: false}), parser.array('photos'), (req, res) => {

    const validationResult = putPostValidator(req.body)
    const post = posts.find(p => p.id === req.params.id);
    const payload = (req.headers.authorization).split('.')
    var s = new Buffer.from(payload[1], 'base64')
    const allOFContact = s.toString()
    var contactFinal = JSON.parse(allOFContact)
    delete contactFinal.iat

        if(post === undefined){
            res.sendStatus(404);
        }else if(contactFinal.userID == post.contacts.userID){ 
            if(req.files != null){
                if(req.files.length < 5){
                    images = req.files
                }else{
                    res.sendStatus(400)
                }
            }
            if(req.body.title != null) {post.title = req.body.title}
            if(req.body.description != null) {post.description = req.body.description}
            if(req.body.category != null) {post.category = req.body.category}
            if(req.body.location != null) {post.location = req.body.location}
            if(req.files != null) {post.image = req.files}
            if(req.body.price != null) {post.price = req.body.price}
            if(req.body.delivery != null) {post.delivery = req.body.delivery}
            if(req.body.constructor === Object && Object.keys(req.body).length === 0 || !validationResult){
                res.sendStatus(400)
            }else{
                res.sendStatus(200)
                res.json(req.file)
            }
            
        }else{
            res.sendStatus(401)
        }
    
    
})

//delete posting by posting id
app.delete('/posting/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    const postindex = posts.findIndex(p => p.id === req.params.id);
    const post = posts.find(p => p.id === req.params.id);

    const payload = (req.headers.authorization).split('.')
    var s = new Buffer.from(payload[1], 'base64')
    const allOFContact = s.toString()
    var contactFinal = JSON.parse(allOFContact)
    delete contactFinal.iat


    if(post === undefined){
        res.sendStatus(404);
    }else if (contactFinal.userID == post.contacts.userID){
        posts.splice(postindex, 1)
        res.sendStatus(200)
    }else{
        res.sendStatus(401)
    }
})


//display html document
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'/HumanReadableHTMLDocumentation.html'))
})

let serverInstance = null

module.exports =  {
    start : function(){
        serverInstance  = app.listen(app.get('port'), () => {
            console.log(`Node app is running on port`)
        })
    },
    close : function(){
        serverInstance.close()
    }
}