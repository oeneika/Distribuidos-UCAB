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

const ip = process.env.IP;
var nextip = process.env.NEXTIP;

const iaas = process.env.IAAS;
const iaasip = process.env.IAASIP;


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

    //Traer ultima config del IaaS
    let opt = {
        method: "POST",
        uri: iaasip + iaas + "/getConfig",
        resolveWithFullResponse: true,
        json: true,
        body: {
            port: port
        }
    };

    rp(opt)
    .then(responsea => {
        let responseabody = _.pick(responsea.body, ["message","config"]);
        
        //Si existe una config la actualiza
        if(responseabody.message === "exito"){
            console.log(responseabody.config);
            nextip = responseabody.config.nextip;
            nextplayer = responseabody.config.nextplayer;
        }


        //Objeto para notificar a la red
        let body2 = {
            playernotified: nextplayer,
            newplayer: {
                port: port,
                ip: ip
            }
        }

        let options = {
            method: "POST",
            uri: nextip + nextplayer + "/newplayer",
            resolveWithFullResponse: true,
            json: true,
            body: body2
        };

        rp(options)
            .then(response => {
                response = response.body;
                //console.log("pasamos la info para el siguiente new  " + nextplayer);
                //console.log("new "+JSON.stringify(response));

                //Trae las partidas del IaaS
                let opts = {
                    method: "GET",
                    uri: iaasip + iaas + "/getGames",
                    resolveWithFullResponse: true,
                    json: true
                };

                rp(opts)
                .then(responsec => {
                    let r = responsec.body;
                    games = r.games;
                })
                .catch(e => {});

  

                res.json({ status: response.status, message: response.message });
            })
            .catch(e => {
                console.log("Error pasando la papa a " + nextplayer);
                res.json({ status: "error", message: "Error" });
            });

    })
    .catch(e => {
        console.log("Error trayendo data del IaaS");
        res.json({ status: "error", message: "Error" });
    });
           

});

//Une un nodo a la red
app.post("/newplayer", urlencodedParser, (req, res) => {   
    let body = _.pick(req.body, ["playernotified", "newplayer"]);

    //
    if (body.playernotified != nextplayer) {

        // 
        let options = {
            method: "POST",
            uri: nextip + nextplayer + "/newplayer",
            resolveWithFullResponse: true,
            json: true,
            body: body
        };

        rp(options)
            .then(response => {
                response = response.body;
                //console.log("pasamos la info para el siguiente  " + nextplayer);
                //console.log(JSON.stringify(response));
                res.json({ status: response.status, message: response.message });
            })
            .catch(e => {
                //console.log("Error pasando la papa a " + nextplayer);
                res.json({ status: "error", message: "Error" });
            });

    } else {

        if (port != body.newplayer.port) {
            //console.log("Nodo cambia su config a: ");
            /*console.log({
                nextplayer: body.newplayer.port,
                nextip: body.newplayer.ip,
                port: port
            });*/
            //Setea la nueva config al IaaS y local
            let opt = {
                method: "POST",
                uri: iaasip + iaas + "/setConfig",
                resolveWithFullResponse: true,
                json: true,
                body: {
                    nextplayer: body.newplayer.port,
                    nextip: body.newplayer.ip,
                    port: port
                }
            };

            rp(opt)
                .then(response => {
                    nextplayer = body.newplayer.port;
                    nextip = body.newplayer.ip;              
                })
                .catch(e => {
                    //console.log("Error pasando la papa a " + nextplayer);
                    
                });
        
        }

        //console.log("El ultimo nodo devuelve");
        res.json({ status: "success", message: "Jugador agregado con exito" });
    }

});

//Devuelve todas las partidas
app.get("/getGames", urlencodedParser, (req, res) => {

    res.json({ status: "success", message: "exito", partidas: games });

});

//Devuelve el nextplayer
app.get("/getNextPlayer", urlencodedParser, (req, res) => {

    res.json({ status: "success", message: "exito", nextplayer: nextplayer });

});


//Revisa si el nombre recibido existe
app.post("/checkgamename", urlencodedParser, (req, res) => {
    let body = req.body;

    //Si no hay partidos lo agrega de una
    if (games.length < 1) {

        sendNewGame(body, res);


    } else {

        let flag = false;
        for (let index = 0; index < games.length; index++) {
            let element = games[index].name;
            if (body.name.localeCompare(element) == 0) {
                flag = true;          
            } 

        }

        if(flag){
            res.json({ status: "error", message: "el nombre de la partida ya esta en uso" });
        }else{
            sendNewGame(body, res);
        }

    }

    //res.json({ status: "success", message: "partida creada con exito" });

});


/**
 * Envia un objeto de partida nuevo a la red
 * @param {*} body: objeto con el nombre de la partida
 */
function sendNewGame(body, res) {
    //Agrega
    let game = {
        name: body.name,
        status: 0,
        owner: port,
        visitor: 0,
        ownerip: ip,
        visitorip: "",
        winner: "", //cuando un jugador gana se le notifica a toda la red (usar funcion modify game de server.js del back)
        winnername: "",
        turn: port,
        plays: [/*{ port: "", name: "", piece: "" }*/], //(puerto del jugador, nombre del jugador, no definido)
        pieces: [{ port: port, name: body.playername, pieces: [] }] //se tendran dos objetos, uno para cada jugador
    }; 
    games.push(game); 

     //Envia la nueva partida a todos los nodos
     let optg = {
        method: "POST",
        uri: iaasip + iaas + "/setGames",
        resolveWithFullResponse: true,
        json: true,
        body: { games : games }
    };

    rp(optg)
        .then(response => { })
        .catch(e => {});


    
    //Envia la nueva partida a todos los nodos
    let options = {
        method: "POST",
        uri: nextip + nextplayer + "/addNewGame",
        resolveWithFullResponse: true,
        json: true,
        body: game
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

    if (newgame.owner != nextplayer) {

        let options = {
            method: "POST",
            uri: nextip + nextplayer + "/addNewGame",
            resolveWithFullResponse: true,
            json: true,
            body: newgame
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

    } else {

        res.json({ status: "success", message: "partida creada con exito" });
    }

});

//Unirse a partida
app.post("/joinGame", urlencodedParser, (req, res) => {
    let gamename = req.body.name;
    let gamepieces = [
        "0:0", "0:1", "0:2", "0:3", "0:4", "0:5", "0:6",
        "1:1", "1:2", "1:3", "1:4", "1:5", "1:6",
        "2:2", "2:3", "2:4", "2:5", "2:6",
        "3:3", "3:4", "3:5", "3:6",
        "4:4", "4:5", "4:6",
        "5:5", "5:6",
        "6:6"
    ];
    /*gamepieces = [
        "0:0", "0:1"
    ];*/

    for (let index = 0; index < games.length; index++) {
        let element = games[index].name;

        if (gamename.localeCompare(element) == 0) {         
            games[index].visitor = port;
            games[index].visitorip = ip;
            games[index].status = 1;
            games[index].pieces.push({ port: port, name: req.body.playername, pieces: [] });


            //Se reparten las fichas
            let finished = false;
            let i1;
            let i2;

            while(finished == false){
                i1 = Math.floor(Math.random() * (gamepieces.length));
                i2 = Math.floor(Math.random() * (gamepieces.length));

                if(i1 != i2){

                    games[index].pieces[0].pieces.push(gamepieces[i1]); 
                    games[index].pieces[1].pieces.push(gamepieces[i2]); 

                    gamepieces.splice(i1, 1);
                    i2 = i1 < i2 ? i2-1 : i2;
                    gamepieces.splice(i2, 1);

                    if(gamepieces.length < 2){
                        finished = true;
                    }  

                }

            }

            updateGame(games[index], port, res);
        }
    }


});

//Hace el post para actualizar el juego
function updateGame(game, playernotified, res){
  let options = {
      method: "POST",
      uri: nextip + nextplayer + "/updateGame",
      resolveWithFullResponse: true,
      json: true,
      body: {game:game, playernotified:playernotified}
  };

    rp(options)
        .then(response => {
            //console.log("despues de modify");
            res.json({ status: response.status, message: response.message });
        })
        .catch(e => {
            res.json({ status: "error", message: "Error" });
        });
  }

//
app.post("/updateGame", urlencodedParser, (req, res) => {
  //console.log("nodo recibe modify");
  let game = req.body.game;
  let playernotified = req.body.playernotified;

  for (let index = 0; index < games.length; index++) {
      let element = games[index].name;

      if (game.name.localeCompare(element) == 0) {
          games[index] = game;

          if (nextplayer != playernotified) {
            updateGame(game, playernotified, res);
          } else {
              
            //Actualiza la partida en el Iaas
            let optg = {
                method: "POST",
                uri: iaasip + iaas + "/setGames",
                resolveWithFullResponse: true,
                json: true,
                body: { games : games }
            };

            rp(optg)
                .then(response => { })
                .catch(e => {});


              res.json({ status: "success", message: "partida actualizada" });
          }


      }
  }

});


//Devuelve una partida
app.post("/getGame", urlencodedParser, (req, res) => {
    
    let gamename = req.body.gamename;
    let flag = false;
    let element;
    let element2;
    //console.log(gamename);
    for (let index = 0; index < games.length; index++) {
        element = games[index];

        //console.log("-" +element.name);
        if (element.name.localeCompare(gamename) == 0) {
            element2 = element;
            flag = true;        
            //console.log("en bandera");
        }

    }

    if(flag){
        res.json({ status: "success", message: "exito", partida: element2 });
    }else{
        res.json({ status: "error", message: "la partida no existe"});
    }
    


});


//Hacer una jugada
function makePlay(game, postport, postip, res) {

    /*let otro_jugador = "";
    let otra_ip = ""


    if (game.owner == postport) {
        otro_jugador = game.visitor;
        otra_ip = game.visitorip;
    } else {
        otro_jugador = game.owner;
        otra_ip = game.ownerip;
    }*/


    let options = {
        method: "POST",
        uri: nextip + nextplayer + "/makePlay",
        resolveWithFullResponse: true,
        json: true,
        body: {game:game, port:postport, ip:postip}
    };

    //console.log("uri: "+options.uri);
    rp(options)
        .then(response => {
            res.json({ status: response.status, message: response.message });
        })
        .catch(e => {
            res.json({ status: "error", message: "Error" });
        });

}
app.post("/makePlay", urlencodedParser, (req, res) => {
    let game = req.body.game;
    let postport = req.body.port;
    let postip= req.body.ip;

    //Busco la partida y solo me la modifico a mi y se la mando al otro jugador de la partida
    //(no recorro toda la red, solo se la envio al otro jugador para que la actualice el solo)
    for (let index = 0; index < games.length; index++) {
        let element = games[index].name;

        if (game.name.localeCompare(element) == 0) {
            games[index] = game;



            if (postport != nextplayer) {
                makePlay(game, postport, postip, res);
            } else {

                //Envia la nueva al Iaas
                let optg = {
                    method: "POST",
                    uri: iaasip + iaas + "/setGames",
                    resolveWithFullResponse: true,
                    json: true,
                    body: { games : games }
                };

                rp(optg)
                    .then(response => { })
                    .catch(e => {});


                res.json({ status: "success", message: "partida actulizada" });
            }
        }
    }

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


    if (nodeinfo.haspapa) {
        res.json({ status: "success", message: "endgame" });
        process.exit(0);
    } else {
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
});;