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
var games = [];

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

//Setea el nombre del nuevo nodo en la red
app.post("/setName", urlencodedParser, (req, res) => {

    //Body del post, contiene el nombre del nuevo jugador
    let body = req.body;
    process.env.NAMENODE = body.name;

    //Objeto para notificar a la red
    let body2 = {
        playernotified: nextplayer,
        newplayer: {
            port: port
        }
    }

    let options = {
        method: "POST",
        uri: "http://localhost:" + nextplayer + "/newplayer",
        resolveWithFullResponse: true,
        json: true,
        body:  body2
    };
    
    rp(options)
    .then(response => {
        response = response.body;
        //console.log("pasamos la info para el siguiente new  " + nextplayer);
        //console.log("new "+JSON.stringify(response));
        games = response.games ;
        res.json({ status: response.status, message: response.message});
    })
    .catch(e => {
        console.log("Error pasando la papa a " + nextplayer);
        res.json({ status: "error", message: "Error"});
    });

});

//Une un nodo a la red
app.post("/newplayer", urlencodedParser, (req, res) => {
    let body = _.pick(req.body, ["playernotified", "newplayer"]);
    if (body.playernotified != nextplayer) {

      // 
      let options = {
        method: "POST",
        uri: "http://localhost:" + nextplayer + "/newplayer",
        resolveWithFullResponse: true,
        json: true,
        body:  body
      };
  
      rp(options)
        .then(response => {       
          response = response.body;
          //console.log("pasamos la info para el siguiente  " + nextplayer);
          //console.log(JSON.stringify(response));
          res.json({ status: response.status, message: response.message, games: response.games });
        })
        .catch(e => {
          //console.log("Error pasando la papa a " + nextplayer);
          res.json({ status: "error", message: "Error"});
        });
  
    } else {

      if(port != body.newplayer.port){
        nextplayer = body.newplayer.port;
      }

      //console.log("El ultimo nodo devuelve");
      res.json({ status: "success", message: "Jugador agregado con exito", games: games });
    }
   
});

//Devuelve todas las partidas
app.get("/getGames", urlencodedParser, (req, res) => {
    
  res.json({ status: "success", message: "exito", partidas: games });

});



//Revisa si el nombre recibido existe
app.post("/checkgamename", urlencodedParser, (req, res) => {
    let body = req.body;
    
    //Si no hay partidos lo agrega de una
    if (games.length < 1) {

      sendNewGame(body, res);
      
      
    }else{

      for (let index = 0; index < games.length; index++) {
        let element = games[index].name;

        if(body.name == element){
          res.json({ status: "error", message: "el nombre de la partida ya esta en uso" });
        }else{
          sendNewGame(body, res);
        }
        
      }
      
    }

    //res.json({ status: "success", message: "partida creada con exito" });
 
});


/**
 * Envia un objeto de partida nuevo a la red
 * @param {*} body: objeto con el nombre de la partida
 */
function sendNewGame(body, res){
    //Agrega
    let game = {
      name: body.name,
      status: 0,
      owner: port,
      visitor: 0,
      winner: 0, //cuando un jugador gana se le notifica a toda la red (usar funcion modify game de server.js del back)
      winnername: "",
      plays: [], //--> {port: , name: , ficha o jugada: } (puerto del jugador, nombre del jugador, no definido)
      pieces: [] //-> {port: , name: , fichas: [] } se tendran dos objetos, uno para cada jugador
    };
    games.push(game);

    //Envia la nueva partida a todos los nodos
    let options = {
      method: "POST",
      uri: "http://localhost:" + nextplayer + "/addNewGame",
      resolveWithFullResponse: true,
      json: true,
      body:  game
    };

    rp(options)
    .then(response => {
      response = response.body
      console.log(response.message);
      res.json({ status: "success", message: response.message });
    })
    .catch(e => {
      res.json({ status: "error", message: "Error" });
    });
}

//Crear partida
app.post("/addNewGame", urlencodedParser, (req, res) => {

  let newgame = req.body;
  games.push(newgame);

  if(newgame.owner != nextplayer){

    let options = {
      method: "POST",
      uri: "http://localhost:" + nextplayer + "/addNewGame",
      resolveWithFullResponse: true,
      json: true,
      body:  newgame
    };
    
    rp(options)
    .then(response => {
      response = response.body;
      console.log(response.message);
      //console.log("pasamos la info para el siguiente  " + nextplayer);
      res.json({ status: "success", message: response.message });
    })
    .catch(e => {
      //console.log("Error pasando la papa a " + nextplayer);
      res.json({ status: "error", message: "Error" });
    });

  }else{
    
    res.json({ status: "success", message: "partida creada con exito" });
  }

});

//Unirse a partida
app.post("/joinGame", urlencodedParser, (req, res) => {
  let gamename = req.body.name;


  for (let index = 0; index < games.length; index++) {
    let element = games[index].name;

    if(gamename == element){
      games[index].visitor = port;
      games[index].status = 1;


      //En este punto se deben repartir las fichas
      //

      modifyGame(games[index], res);     
    }
  }
    

});

function modifyGame(game, res){
  //Agrega

  //Envia la nueva partida a todos los nodos
  let options = {
    method: "POST",
    uri: "http://localhost:" + nextplayer + "/modifyGame",
    resolveWithFullResponse: true,
    json: true,
    body:  game
  };

  rp(options)
  .then(response => {
    res.json({ status: response.status, message: response.message });
  })
  .catch(e => {
    res.json({ status: "error", message: "Error" });
  });
}

app.post("/modifyGame", urlencodedParser, (req, res) => {

  let game = req.body;
  for (let index = 0; index < games.length; index++) {
    let element = games[index].name;

    if(game.name == element){
      games[index] = game;

      if(nextplayer != game.visitor){
        modifyGame(game, res);     
      }else{
        res.json({ status: "success", message: "partida modificada, usuario agregado" });
      }


    }
  }

  

});


//Devuelve una partida
app.post("/getGame", urlencodedParser, (req, res) => {
    
  let gamename = req.body.gamename;


  for (let index = 0; index < games.length; index++) {
    const element = games[index];

    if(element.name = gamename){
      
      res.json({ status: "success", message: "exito", partida: element });

    }
    
  }

 

});


//Hacer una jugada
app.post("/makePlay", urlencodedParser, (req, res) => {
  let game = req.body.game;

  //Busco la partida y solo me la modifico a mi y se la mando al otro jugador de la partida
  //(no recorro toda la red, solo se la envio al otro jugador para que la actualice el solo)
  for (let index = 0; index < games.length; index++) {
    let element = games[index].name;

    if(game.name == element){
   
      //modificar

      //Aqui hacer una funcion que envie
    }
  }
    
  res.json({ status: "success", message: "exito" });

});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
