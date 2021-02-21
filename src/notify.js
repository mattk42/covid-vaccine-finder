const getDatabase = require('./getDatabase');
const sendEmail = require('./sendEmail');

module.exports = async function notify(type,id, store_description, email_details) {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists({ id: "notifications" });
    const notified = []  
    let { resources } = await container.items
      .query({
        // TODO: This is a terrible way to do this for multiple reasons. But with plans to move
        // to RDS soon this may not be worth investing in right now.
        // While type is not derived from user input, it is always dangerous
        // to interpolate directly into the query.
        // Also we should be able to find which notifications have this specific store
        // but the query wasn't coming easy to me, so leaving as is for now as POC.
        query: `SELECT c.email,c.${type} as stores FROM c where c.${type} != null`,
      })
      .fetchAll();

    for (const resource of resources) {
        if ( resource.stores.includes(id) && !notified.includes(resource.email)){
            console.log(`Notifying ${resource.email}`)
            let sendPromise = sendEmail(resource.email, `Covid Vaccine Appointment Available at ${store_description}!`,email_details)

            // Handle promise's fulfilled/rejected states
            sendPromise.then(
              function(data) {
                notified.push(resource.email);
                console.log(data.MessageId);
              }).catch(
                function(err) {
                console.error(err, err.stack);
              });
        }
    }
}  
