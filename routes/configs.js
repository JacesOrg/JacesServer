module.exports = function (fastify, opts, done) {
    fastify.get('/get', async (req, reply)=>{
        try{
            const configsColl = fastify.mongo.db.collection("configs")
            const configs = await configsColl.find({}).toArray()
            return reply.send(configs)
        }catch (e) {
            console.log(e)
            reply.status(500).send("Bad response")
        }
    })

    fastify.post('/create', async (req, reply)=>{
        try{
            const configsColl = fastify.mongo.db.collection("configs")
            const {config} = req.body
            await configsColl.insertOne(config)
            return reply.send({success: true})
        }catch (e) {
            console.log(e)
            reply.status(500).send("Bad response")
        }
    })

    fastify.post('/update/:id', async (req, reply)=>{
        try{
            const configsColl = fastify.mongo.db.collection("configs")
            const id = req.params.id
            const {config} = req.body
            await configsColl.updateOne({_id: new fastify.mongo.ObjectId(id)},{$set: config})
            return reply.send({success: true})
        }catch (e) {
            console.log(e)
            reply.status(500).send("Bad response")
        }
    })

    fastify.delete('/delete/:id', async (req, reply)=> {
        try {
            const configsColl = fastify.mongo.db.collection("configs")
            const id = req.params.id
            await configsColl.deleteOne({_id: new fastify.mongo.ObjectId(id)})
            return reply.send({success: true})
        } catch (e) {
            console.log(e)
            reply.status(500).send("Bad response")
        }
    })

    done()
}
