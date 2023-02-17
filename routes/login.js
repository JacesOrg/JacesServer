module.exports = function (fastify, opts, done) {
    fastify.post('/login', async (req, reply)=>{
        try{
            const {client_id, host_id} = req.body;
            console.log(req.body);
            const clients = fastify.mongo.db.collection('clients')
            const id = await clients.findOne({client_id: client_id})
            if(id && Object.keys(id).length > 0) {
                const token = fastify.jwt.sign({client_id: client_id, host_id: host_id})
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
            console.log(e);
            return reply.status(500).send('Internal server error')
        }
    } )

    done()
}
