const clients = require('../lib/processWsRequest')
const { handleSaveStats, handleUpdateContainerStatus, handleUpdateConfigStatus } = require('../lib/wsutils')
module.exports = (fastify, opts, done) => {
    fastify.get('/receive', {websocket: true}, async (conn, req) => {
        clients[req.host_id] = conn

        conn.socket.on('message', async message => {
            // message.toString() === 'hi from client'
            try {
                console.log('Message received from', req.host_id); 
                const msg = JSON.parse(message.toString())
                console.log(message.toString());
                if(msg.type === 'hostStat'){
                    const saveResult = await handleSaveStats(fastify.mongo, msg.hostStats.host_id, msg.hostStats)
                    if(saveResult)
                        conn.socket.send(JSON.stringify({type: 'saveStatsMessage', success: true, message: 'Stats saved successfully'}))
                    else
                        conn.socket.send(JSON.stringify({type: 'saveStatsMessage', success: false, message: 'Error saving stats'}))
                }else if(msg.type === 'updateConfigs'){
                    const to_send = []
                    const hostColl = fastify.mongo.db.collection('hosts');
                    const host = await hostColl.findOne({_id: new fastify.mongo.ObjectId(msg.host_id)})
                    console.log(host);
                    for(let conf of host.configs)
                        if(conf.status == 'UPDATE' || conf.status == 'NEW')
                            to_send.push(conf)
                    if(to_send.length > 0)
                        conn.socket.send(JSON.stringify({type: 'updateConf', configs: to_send}))
                }else if(msg.type === 'containerStatus'){
                    await handleUpdateContainerStatus(fastify.mongo, msg.host_id, msg.name, msg.status)
                }else if(msg.type === 'updateConf'){
                    await handleUpdateConfigStatus(fastify.mongo, msg.host_id, msg.container_id, msg.success, msg.processing)
                }
            } catch (error) {
                console.log("WTF");
                console.log(error);
                conn.socket.send(JSON.stringify({success: false, message: error.message})) 
            }

        })

        conn.socket.on('close', function (reasonCode, description) {
            console.log(req.host_id, 'disconnected');
            delete clients[req.host_id]     
            console.log(clients)
        });

    })

    done()
}
