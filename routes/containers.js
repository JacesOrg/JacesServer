const fs=require('fs')
const {pipeline} = require('stream')
const util = require('util')
const pump = util.promisify(pipeline)
const path = require('path')

module.exports = function (fastify, opts, done) {

    fastify.post('/stat/set/:container_id', async (req, reply)=>{
        try{
            const container_id = req.params.container_id;
            const containerColl = fastify.mongo.db.collection('containers')
            const stat = req.body
            stat.created = new Date()

            // const cont = await containerColl.findOne({client_id: req.client_id, container_id: container_id})
            // if(!cont)
            //     return reply.status(404).send({success: false, message: 'Container not found'})
            await containerColl.updateOne({client_id: req.client_id, container_id: container_id}, {$set: stat}, {upsert: true})
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }

    })

    fastify.get('/stat/get/:container_id', async (req, reply)=>{
        try{
            const container_id = req.params.container_id;
            const containerColl = fastify.mongo.db.collection('containers')
            const cont = await containerColl.findOne({client_id: req.client_id, container_id: container_id})
            if(!cont)
                return reply.status(404).send({success: false, message: 'Container not found'})
            return reply.send(cont)
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }
    })

    fastify.get('/actions/get/:host_id', async (req, reply)=>{
        try{
            const host_id = req.params.host_id;
            const actionColl = fastify.mongo.db.collection('actions')
            const actions = await actionColl.find({client_id: req.client_id, host_id: host_id, status: "NEW"}).sort({created: 1}).toArray()
            return reply.send(actions)
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }
    })

    fastify.post('/actions/set/:host_id', async (req, reply)=>{
        try{
            const host_id = req.params.host_id;
            const action = req.body
            action.client_id = req.client_id
            action.host_id = host_id
            action.status = "NEW"
            const actionColl = fastify.mongo.db.collection('actions')
            const actions = await actionColl.insertOne(action)
            return reply.send({success: true, id: actions.insertedId})
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }
    })

    fastify.get('/actions/status/:action_id', async (req, reply)=>{
        try{
            const action_id = req.params.action_id;
            const actionColl = fastify.mongo.db.collection('actions')
            const action = await actionColl.findOne({_id: new fastify.mongo.ObjectId(action_id)})
            return reply.send({success: true, status: action.status, message: action.message})
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }
    })

    fastify.get('/actions/update/:action_id', async (req, reply)=>{
        try{
            const action_id = req.params.action_id;
            const {status, message} = req.body
            const actionColl = fastify.mongo.db.collection('actions')
            await actionColl.updateOne({_id: new fastify.mongo.ObjectId(action_id)}, {$set: {status: status, message: message}})
            return reply.send({success: true})
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }
    })

    fastify.get('/download', async (req, reply)=>{
        
        try {
            const filesColl = fastify.mongo.db.collection('files')
            const {image} = req.query
            const fileObj = await filesColl.find({image: image}).sort({created: -1}).toArray()
            reply.header('Content-Disposition', fileObj[0].filename)
            return reply.sendFile(fileObj[0].filename)
        } catch (error) {
            console.log(error);
            return reply.status(500).send({success: false, message: error.message})
        } 
    })
    done()
}
