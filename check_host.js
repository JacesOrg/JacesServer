const { MongoClient } = require('mongodb');
const dotenv = require('dotenv')

dotenv.config()

const client = new MongoClient(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}`);

const start = async () =>{
    try {
       await client.connect()
       const statsColl = client.db(process.env.MONGO_DB).collection("hosts_stat")
       const hostsColl = client.db(process.env.MONGO_DB).collection("hosts")
       
       setInterval(async ()=>{
            let dt = new Date()
            dt = dt.setMinutes(dt.getMinutes()-5)
            const hosts = await hostsColl.find({}).project({_id: 1}).toArray()
            console.log('Getting data from:', new Date(dt));
            const statResults = await statsColl.find({created: {$gte: new Date(dt)}}).project({host_id: 1}).toArray()
            // console.log(statResults);
            // console.log(hosts);
            console.log('Found stats', statResults.length);
            const onlineHosts = []
            let found = false
            for(let stat of statResults){
                for(let host of hosts){
                    console.log(host._id.equals(stat.host_id), host._id, stat.host_id);
                    if(host._id.equals(stat.host_id) ){
                        console.log('Host online', host);
                        await hostsColl.updateOne({_id: host._id}, {$set: {status:'ONLINE'}})
                        onlineHosts.push(host._id)
                        found = true
                        break
                    }
                }
                if(found) break
            }

            await hostsColl.updateMany({_id: {$nin: onlineHosts}}, {$set: {status: 'OFFLINE'}})
       }, 1000*60*1)
    } catch (error) {
        console.log(error);
    }
}
start()