
const mysql = require('mysql');
const dbobj = mysql.createPool({
    connectionLimit : 10,
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'domino_distribuidos'
  }); 

/**
 * Hace una query a la db
 * @param {string} querystr: puede ser un update, un delete, un insert, un get, etc
 */
module.exports = function query (querystr, callback){
    console.log("la query es: " + querystr);
    /*dbobj.connect();
 
    dbobj.query(querystr, function (error, results, fields) {
      
      if (error) throw error;
      console.log('The solution is: ', results[0].solution);

    });
    
    dbobj.end();*/

    //let result;

    dbobj.getConnection(function(err, connection) {
      if (err) throw err; // not connected!
     
      // Use the connection
      connection.query(querystr, function (error, results, fields) {

        // When done with the connection, release it.
        connection.release();
        
        //result = results;

        callback(results);
        //console.log("ta: " + result);
        // Handle error after the release.
        if (error) throw error;
     
        // Don't use the connection here, it has been returned to the pool.
      });
    });
  

}