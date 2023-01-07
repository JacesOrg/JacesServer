module.exports = function (fastify, opts, done) {
    fastify.post('/login', async (req, reply)=>{
        try{
            const {client_id} = req.body;
            const clients = fastify.mongo.db.collection('clients')
            const id = await clients.findOne({client_id: client_id})
            if(id) {
                const token = fastify.jwt.sign({client_id: client_id})
                return reply.send({token: token})
            }else{
                return reply.status(401).send('Unauthorized')
            }

        }catch (e) {
            return reply.status(500).send('Internal server error')
        }


    })

    fastify.post('/register', async (req, reply) =>{
        try{
            const {client_id} = req.body;
            const clients = fastify.mongo.db.collection('clients')
            await clients.insertOne({client_id: client_id})
            return reply.send({success: true})
        }catch (e) {
            return reply.status(500).send('Internal server error')
        }
    } )

    done()
}
