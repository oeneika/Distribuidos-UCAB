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
const ip = process.env.IP;

var configs = {
  
     //Ejemplo:
     /*"10001": {
        nextplayer: 10002,
        nextip: "192.......",
     },
     "10002": {
        nextplayer: 10001,
        nextip: "192.......",
     },*/
     
};

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


//Devuelve la config de un nodo
app.post("/getConfig", urlencodedParser, (req, res) => { 
    let body = _.pick(req.body, ["port"]);

    //Si existe la config
    if(typeof configs[body.port] !== "undefined") {
        res.json({ status: "success", message: "exito", config: configs[body.port] });
    }else {
        res.json({ status: "success", message: "error", config: {} });
    }

});

//Setea la config de un nodo
app.post("/setConfig", urlencodedParser, (req, res) => { 
    let body = _.pick(req.body, ["port","nextplayer","nextip"]);
    //console.log(body.port);
    //Si existe la config la setea
    if(typeof configs[body.port] !== "undefined") {
        
        configs[body.port].nextplayer = parseInt(body.nextplayer);
        configs[body.port].nextip = body.nextip;

    }else 
    //Si no existe la añade
    {
        configs[body.port.toString()] = {
            nextplayer: parseInt(body.nextplayer),
            nextip: body.nextip,
        }
        console.log(configs[body.port]);

        
    }


    res.json({ status: "success", message: "exito" });

});


//Devuelve las partidas
app.get("/getGames", urlencodedParser, (req, res) => { 

    res.json({ status: "success", message: "exito", games: games });
    
});



//Setea las partidas
app.post("/setGames", urlencodedParser, (req, res) => { 
    let body = _.pick(req.body, ["port","games"]);
    
    games = body.games;

    res.json({ status: "success", message: "exito" });

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