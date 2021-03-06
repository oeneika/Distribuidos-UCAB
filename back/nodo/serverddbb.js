require("./config/config");
var query = require("./query");

const rp = require("request-promise");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const _ = require("lodash");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

//Contenido del enviroment
const port = process.env.PORT;
var nextplayer = process.env.NEXT;

var app = express();
app.use(
  cors({
    origin: true,
    exposedHeaders: "x-access-token"
  })
);
app.use(bodyParser.json());


//Endpoints
var nodeinfo = { haspapa: false };

//Revisa si el nombre recibido existe en la db
app.post("/checkplayername", urlencodedParser, (req, res) => {
  let body = req.body;
  console.log(body.name);
  
  let a = "SELECT * FROM users WHERE name='"+body.name+"'" ;
  query( a, (result) => {

    if(body.register == 1){
      console.log("a" );
      if (typeof result[0] != "undefined") {
        res.json({ status: "error", message: "el usuario ya existe", id:-1 });
      }else{
  
        //Si no existe lo inserta
        let b = "INSERT INTO users SET name='"+body.name+"'";
        query( b, (result2) => {
          res.json({ status: "success", message: "registrado con exito", id: result2.insertId });
        });
        
      }


    }else {
      console.log("b" );
      if (typeof result[0] == "undefined") {
        //console.log("el resultado es: " + JSON.stringify(result));
        res.json({ status: "error", message: "el usuario no existe", id:-1 });

      }else{

        res.json({ status: "success", message: "usuario traido con exito", id: result[0].id });     
        
      }

    }

  });
 
});

//Revisa si el nombre recibido existe en la db
app.post("/checkgamename", urlencodedParser, (req, res) => {
  let body = req.body;
  //console.log(body.name);
  
  let a = "SELECT * FROM game WHERE name='"+body.name+"'" ;
  query( a, (result) => {

    if (typeof result[0] != "undefined") {
      //console.log("el resultado es: " + JSON.stringify(result));
      res.json({ status: "error", message: "el nombre de la partida ya esta en uso" });
      
    }else{

      //Si no existe lo inserta
      let b = `INSERT INTO game (name, owner) VALUES ( '${body.name}', ${body.userId})`; 
      query( b, (result2) => {
        //console.log("el resultado ess: " + JSON.stringify(result2));
        res.json({ status: "success", message: "partida creada con exito" });
      });
      
    }

  });
 
});


app.get("/getGames", urlencodedParser, (req, res) => {
  
    let b = 'SELECT *, (SELECT users.name FROM users WHERE users.id = game.winner) as winnername from game'; 
    query( b, (result) => {
      //console.log("el resultado ess: " + JSON.stringify(result));
      res.json({ status: "success", message: "exito", partidas: result });
    });


});

app.post("/catchball", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["ball"]);
  if (body.ball == "1") {
    nodeinfo.haspapa = true;
  } else {

    let options = {
      method: "POST",
      uri: "http://localhost:" + nextplayer + "/catchball",
      resolveWithFullResponse: true,
      json: true,
      body: { ball: "1" }
    };
  
    rp(options)
      .then(response => {
        nodeinfo.haspapa = false;
        console.log("La papa se ha  ido para " + nextplayer);
      })
      .catch(e => {
        console.log("Error pasando la papa a " + nextplayer);
      });

    //nodeinfo.haspapa = false;

  
  }

  

  /*setTimeout(function() {
    rp(options)
      .then(response => {
        nodeinfo.haspapa = false;
        console.log("La papa se ha  ido para " + nextplayer);
      })
      .catch(e => {
        console.log("Error pasando la papa a " + nextplayer);
      });
  }, 3000);*/



  res.json({ status: "success", message: "catchball" });
});

app.get("/add", urlencodedParser, (req, res) => {
  

  if(nodeinfo.haspapa){
    res.json({ status: "success", message: "endgame" });
  process.exit(0);
  }else{
    res.json({ status: "failed", message: "endgame" });
  process.exit(0);
  }
  
});



app.get("/endgame", urlencodedParser, (req, res) => {
  console.log(
    "El nodo: " +
      process.env.NAMENODE +
      ", " +
      (nodeinfo != null && nodeinfo.haspapa ? "" : "NO") +
      " tiene la papa"
  );

  res.json({ status: "success", message: "endgame" });
  process.exit(0);
});

app.post("/newplayer", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["playernotified", "newplayer"]);
  if (body.playernotified != nextplayer) {
    // pass info of new player
    let options = {
      method: "POST",
      uri: "http://localhost:" + nextplayer + "/newplayer",
      resolveWithFullResponse: true,
      json: true,
      body:  body
    };

    rp(options)
      .then(response => {
        console.log("pasamos la info para el siguiente  " + nextplayer);
      })
      .catch(e => {
        console.log("Error pasando la papa a " + nextplayer);
      });

  } else {
    nextplayer = body.newplayer.port;
  }

  res.json({ status: "success", message: "newplayer" });
  
});

// not match endpoints
app.get("/*", (req, res) => {
  res.status(404).send();
});

app.post("/*", (req, res) => {
  res.status(404).send();
});

app.put("/*", (req, res) => {
  res.status(404).send();
});

app.delete("/*", (req, res) => {
  res.status(404).send();
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});
