db = db.getSiblingDB('test-database')
// move to the admin db - always created in Mongo
db.auth('root', 'example')
// log as root admin if you decided to authenticate in your docker-compose file...

db = db.getSiblingDB('DB_test');
// create and move to your new database
db.createUser({
'user': "dbUser",
'pwd': "dbPwd",
'roles': [{
    'role': 'dbOwner',
    'db': 'DB_test'}]});
// user created
db.createCollection('collection_test');
// add new collection