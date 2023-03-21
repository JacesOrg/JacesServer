const clients = require('../lib/processWsRequest')
const { getConfigs, handleSaveStats, handleUpdateContainerStatus, handleUpdateConfigStatus, hadleUpdateContainerStats, handleUpdateContainerLogs } = require('../lib/wsutils')
module.exports = (fastify, opts, done) => {
    fastify.get('/receive', {websocket: true}, async (conn, req) => {
        clients[req.host_id] = conn
        conn.socket.on('message', async message => {
            // message.toString() === 'hi from client'
            try {
                console.log('Message received from', req.host_id); 
                const msg = JSON.parse(message.toString())
                if(msg.type === 'hostStat'){
                    const saveResult = await handleSaveStats(fastify.mongo, msg.host_id, msg.hostStats)
                    if(saveResult)
                        conn.socket.send(JSON.stringify({type: 'saveStatsMessage', success: true, message: 'Stats saved successfully'}))
                    else
                        conn.socket.send(JSON.stringify({type: 'saveStatsMessage', success: false, message: 'Error saving stats'}))
                }else if(msg.type === 'updateConfigs'){
                    const to_send = await getConfigs(fastify.mongo, msg.host_id)
                    if(to_send.length > 0)
                        conn.socket.send(JSON.stringify({type: 'updateConf', configs: to_send}))                    
                }else if(msg.type === 'containerStatus'){
                    await handleUpdateContainerStatus(fastify.mongo, msg.host_id, msg.name, msg.status)
                }else if(msg.type === 'updateConf'){
                    await handleUpdateConfigStatus(fastify.mongo, msg.host_id, msg.container_id, msg.success, msg.processing)
                }else if(msg.type == 'containerStats'){
                    await hadleUpdateContainerStats(fastify.mongo, msg.host_id, msg.name, msg.stats)
                }else if(msg.type == 'containerLogs'){
                    await handleUpdateContainerLogs(fastify.mongo, msg.conf_id, msg.name, msg.logs)
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
