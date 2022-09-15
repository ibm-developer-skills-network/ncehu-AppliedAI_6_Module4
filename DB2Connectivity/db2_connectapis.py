import ibm_db
import os
from flask import Flask
from flask import request
from flask import jsonify 
import json

app = Flask(__name__) 
dsn_hostname = os.environ['HOST_URL']
dsn_uid = os.environ['USERNAME']
dsn_pwd = os.environ['PASSWORD']
dsn_port = os.environ['PORT']
dsn_database = "bludb"            
dsn_driver = "{IBM DB2 ODBC DRIVER}"
dsn_protocol = "TCPIP"            
dsn_security = "SSL"              

#Create the dsn connection string
dsn = (
    "DRIVER={0};"
    "DATABASE={1};"
    "HOSTNAME={2};"
    "PORT={3};"
    "PROTOCOL={4};"
    "UID={5};"
    "PWD={6};"
    "SECURITY={7};").format(dsn_driver, dsn_database, dsn_hostname, dsn_port, dsn_protocol, dsn_uid, dsn_pwd, dsn_security)

#Create database connection
try:
    conn = ibm_db.connect(dsn, "", "")
    print ("Connected to database: ", dsn_database, "as user: ", dsn_uid, "on host: ", dsn_hostname)
    command = "select * from cb106 where LOWER(NAME) like '%{}%' OR LOWER(DESCRIPTION) like '%{}%' ".format("arg","arg") 
except:
    print ("Unable to connect: ", ibm_db.conn_errormsg() )
    
@app.route('/courses', methods = ['POST','GET'])  
def course_details(): 
  user_data = request.get_json()  
  list=['on','learn']
  arg=''
  for i in list: 
    if i in user_data['name']:
        arg=user_data['name'].split(i,1)[1]
  
  arg=arg.strip()
  if arg is not None: 
    arg = arg.lower() 
    command = "select * from cb106 where LOWER(NAME) like '%{}%' ".format(arg,arg) 
    print(command)
    stmt = ibm_db.exec_immediate(conn, command)
    dictionary = ibm_db.fetch_both(stmt)
    print(dictionary)
    if (dictionary==False):
        
        return json.loads('{"Nothing_Found":"%s"}'%("Sorry! The course you are looking for may not be available.Try asking for other courses."))
    else:    

        coursename = dictionary['NAME']
        desc = dictionary['DESCRIPTION'] 
        ret_val = '{"Name":"%s","Description":"%s"}'%(coursename,desc)
        return json.loads(ret_val,strict=False)
app.run(host ='0.0.0.0', port = 5000, debug = True)
