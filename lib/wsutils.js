const handleSaveStats = async (mongoInstance, host_id, hostStats) => {
    try {
        const hostColl = mongoInstance.db.collection('hosts');
        const host = await hostColl.findOne({_id: new mongoInstance.ObjectId(host_id)})
        const statColl = mongoInstance.db.collection('hosts_stat');
        const stat_obj = hostStats 
        stat_obj.created = new Date()
        stat_obj.host_id = new mongoInstance.ObjectId(host_id)
        await statColl.insertOne(stat_obj)
        return true
    } catch (error) {
        console.log(error);
        return undefined
    }
}

const handleUpdateContainerStatus = async (mongoInstance, host_id, containerName, status) => {
    try {
        const hostColl = mongoInstance.db.collection('hosts');
        const host = await hostColl.findOne({_id: new mongoInstance.ObjectId(host_id)})
        for(let config of host.configs){
            if(config.name === containerName){
                config.status = status
            }
        }
        console.log(host);
        return true
    } catch (error) {
        console.log(error);
        return undefined
    }
}

const handleUpdateConfigStatus = async (mongoInstance, host_id, container_id, success, processing) =>{
    try {
        const hostColl = mongoInstance.db.collection('hosts');
        const host = await hostColl.findOne({_id: new mongoInstance.ObjectId(host_id)})
        for(let i=0; i< host.configs.length; i++){
            if(host.configs[i].id === container_id)
                if(success)
                    host.configs[i].status = 'DEPLOYED'
                else if (processing)
                    host.configs[i].status = 'PROCESSING'
                else 
                    host.configs[i].status = 'ERROR'
        }
        delete host._id
        await hostColl.updateOne({_id: new mongoInstance.ObjectId(host_id)}, {$set: host})
        return true
    } catch (error) {
        console.log(error);
        return undefined
    }
    
}

module.exports = {
    handleSaveStats,
    handleUpdateContainerStatus,
    handleUpdateConfigStatus
}