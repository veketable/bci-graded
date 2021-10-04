const chai = require('chai');
const expect = chai.expect
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../server');
const chaiJsonSchemaAjv = require('chai-json-schema-ajv')
chai.use(chaiJsonSchemaAjv)
const serverAddr = 'http://localhost:3000'

const postInfoSchema = require('../schemas/postInfoSchema.schema.json')
const getInfoSchema = require('../schemas/getInfoSchema.schema.json')

let loginToken = null
let testPostID = null

describe('Graded API tests', function() {

    before(function() {
        server.start()
    })

    after(function() {
        server.close()
    })

    describe('POST /userSignup', function() {
        it('should create new user', function(done) {
            chai.request(serverAddr)
            .post('/userSignup')
            .send({
                "username": "testuser",
                "password": "testpassword1234", 
                "email": "test.email@gmail.com",
                "phone": "0441252136"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(201)
                done()
            })

        })

        it('should reject request with missing fields', function(done) {
            chai.request(serverAddr)
            .post('/userSignup')
            .send({
                "username": "testuser2",
                "password": "testpassword1234", 
                "phone": "0441252136"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })

        })

        it('should reject request with incorrect data types', function(done) {
            chai.request(serverAddr)
            .post('/userSignup')
            .send({
                "username": "testuser3",
                "password": "testpassword1234",
                "email": null, 
                "phone": 1.5
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })

        })

        it('should reject empty post request', function(done) {
            chai.request(serverAddr)
            .post('/userSignup')
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })

        })
    })

    describe('POST /userLogin', function() {
        it('should login', function(done){
            chai.request(serverAddr)
            .post('/userLogin')
            .auth('testuserLogin', 'testpassword123')
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                loginToken = res.body.token
                done()
            })
        })

        it('should reject with incorrect password', function(done){
            chai.request(serverAddr)
            .post('/userLogin')
            .auth('testuserLogin', 'testpassword12')
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })

        it('should reject with incorrect username', function(done){
            chai.request(serverAddr)
            .post('/userLogin')
            .auth('testuserLog', 'testpassword123')
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })
        it('should reject with with empty authorization', function(done){
            chai.request(serverAddr)
            .post('/userLogin')
            .auth('', '')
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })

    })



    describe('POST /posting', function() {
        it('should create new posting', function(done) {
            chai.request(serverAddr)
            .post('/posting')
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "title": "tv",
                "description": "in good condition 50 inch",
                "category": "tv",
                "location": "oulu",
                "price": "25.4",
                "delivery": "pickup"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(201)
                done()
            })
        })
        it('should reject request with missing fields', function(done) {
            chai.request(serverAddr)
            .post('/posting')
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "title": "tv",
                "description": "in good condition 50 inch",
                "category": "tv",
                "location": "oulu",
                "delivery": "pickup"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })
        it('should reject request with incorrect data types', function(done) {
            chai.request(serverAddr)
            .post('/posting')
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "title": "tv",
                "description": "in good condition 50 inch",
                "category": 213,
                "location": "oulu",
                "price": 25.4,
                "delivery": "pickup"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })
        it('should reject empty post request', function(done) {
            chai.request(serverAddr)
            .post('/posting')
            .set({"Authorization": `Bearer ${loginToken}`})
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })
    })

    describe('GET /posting', function() {
        it('should return post with searched parameters', function(done) {
            chai.request(serverAddr)
            .get('/posting')
            .send({
                "category": "tv",
                "location": "oulu"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                expect(res.body).to.be.jsonSchema(getInfoSchema)
                resArr = res.body
                testPostID = resArr[0].id
                done()
            })
        })
        it('should reject if no posts is found with given parameters', function(done) {
            chai.request(serverAddr)
            .get('/posting')
            .send({
                "category": "talo",
                "location": "vaasa"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
        it('should return every post with empty request', function(done) {
            chai.request(serverAddr)
            .get('/posting')
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                expect(res.body).to.be.jsonSchema(getInfoSchema)
                done()
            })
        })
        it('should reject request with incorrect data types', function(done) {
            chai.request(serverAddr)
            .get('/posting')
            .send({
                "category": 25,
                "location": "vaasa"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })

    })

    describe('PUT /posting/{postID}', function() {
        it('should edit post with correct id and user token', function(done) {
            chai.request(serverAddr)
            .put('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "title": "xbox",
                "description": "ok kuntoinen"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('should reject with incorrect post id', function(done) {
            chai.request(serverAddr)
            .put('/posting/'+"jcdac8fs-ed28-4dff-8aac-a5b1dfgd80e62")
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "title": "xbox",
                "description": "ok kuntoinen"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
        it('should reject with incorrect login token', function(done) {

            loginTokenWrong = loginToken + "as"
            chai.request(serverAddr)
            .put('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${loginTokenWrong}`})
            .send({
                "title": "xbox",
                "description": "ok kuntoinen"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })
        it('should reject empty request', function(done) {
            chai.request(serverAddr)
            .put('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${loginToken}`})
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })
        it('should reject with incorrect key values', function(done) {
            chai.request(serverAddr)
            .put('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "wrongkey": "xbox",
                "description": "ok kuntoinen"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })
        it('should reject with incorrect data types', function(done) {
            chai.request(serverAddr)
            .put('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${loginToken}`})
            .send({
                "title": 25.4,
                "description": "ok kuntoinen"
            })
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })
        
    })

    describe('DELETE /posting/{postID}', function() {
        it('should reject with incorrect login token', function(done) {
            wrongToken = loginToken + "hsds"
            chai.request(serverAddr)
            .del('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${wrongToken}`})
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })

        it('should reject with incorrect post id', function(done) {
            chai.request(serverAddr)
            .del('/posting/'+testPostID+"fdhs")
            .set({"Authorization": `Bearer ${loginToken}`})
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })

        it('should delete post with correct id and user token', function(done) {
            chai.request(serverAddr)
            .del('/posting/'+testPostID)
            .set({"Authorization": `Bearer ${loginToken}`})
            .end(function(err, res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })

    })
})