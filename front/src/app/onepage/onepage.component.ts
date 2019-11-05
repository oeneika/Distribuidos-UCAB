import { Component, OnInit } from "@angular/core";
import { HttpClient} from '@angular/common/http';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: "app-onepage",
  templateUrl: "./onepage.component.html",
  styleUrls: ["./onepage.component.css"]
})
export class OnepageComponent implements OnInit {
  myFormJugada: FormGroup;
  myFormCrearPartida: FormGroup;
  myFormRegistrarJugador: FormGroup;
  closeResult: string;
  private modalRef: NgbModalRef;

  myPlayerId;
  myNodePort = "10001";
  isValidPlayerName = false;
  playerName = '';
  allGames = [];
  actualGame = {
    name: "",
    status: 0,
    owner: "",
    visitor: "",
    winner: "", //cuando un jugador gana se le notifica a toda la red (usar funcion modify game de server.js del back)
    winnername: "",
    turn: "",
    plays: [], //(puerto del jugador, nombre del jugador, no definido)
    pieces: [] // se tendran dos objetos, uno para cada jugador
  };;
  Nextplayer:0;

  constructor(
    public fb: FormBuilder,
    private http: HttpClient,
    private modalService: NgbModal) {

    this.myFormJugada = this.fb.group({
      jugada: ['', [Validators.required]],
    });

    this.myFormCrearPartida = this.fb.group({
      nameGame: ['', [Validators.required]],
    });
    this.playerName = '';

  }

  ngOnInit() {

    /*setTimeout(function() {
      if(this.isValidPlayerName){    
        this.traerPartidas();
      }
    }, 3000);*/
   
  }

  //Abre un modal
  open(content) {
    let options: NgbModalOptions = {
      size: 'lg',
      centered: true
    };

    this.modalRef = this.modalService.open(content, options);
  }


  //Registra el nombre del usuario y lo registra en la red
  registrarse(){

    let object = {
      name: this.playerName
    }

    this.http
    .post("http://localhost:"+this.myNodePort+"/setName", object)
    .subscribe((response: any)=>{

     if(response.status == "success"){
       console.log(response.message);
      this.isValidPlayerName = true;

      //Trae las partidas
      this.modalRef.close();
      this.traerPartidas();
   
     }else{
        alert(response.message);
     }

    });

  }

  //Trae todas las partidas
  traerPartidas(){

    setTimeout( a => {

        if(this.isValidPlayerName){  
          this.http
            .get("http://localhost:"+this.myNodePort+"/getGames")
            .subscribe((response: any)=>{
        
            console.log(response.partidas);   
            this.allGames = response.partidas;

            for (let key in this.allGames) {
              if(this.allGames[key].name == this.actualGame.name){
                this.actualGame = this.allGames[key];
              }
            }

            });

            this.http
            .get("http://localhost:"+this.myNodePort+"/getNexPlayer")
            .subscribe((response: any)=>{
              this.Nextplayer = response.nextplayer;
            });
            

        }
        this.traerPartidas();

    }, 3000);

  }

  //Crea una partida
  crearPartida(){
    let gameName = this.myFormCrearPartida.value.nameGame;
    this.myFormCrearPartida.value.nameGame = "";

    //Si no esta vacío
    if(this.actualGame.pieces.every){

      let object = {
        name: gameName,
        playername: this.playerName
      }
  
      this.http
      .post("http://localhost:"+this.myNodePort+"/checkgamename", object)
      .subscribe((response: any)=>{
  
       //console.log(response);
  
       if(response.status == "success"){     
        this.modalRef.close();
       }else{
          alert(response.message);
       }
  
      });

    }else{
      alert("El nombre de la partida no puede estar vacío");
    }

  }

  /**
   * Une al usuario a una partida
   * @param gamename: nombre de la partida
   */
  unirmeAPartida(gamename){
    
    let obj = {
      name: gamename,
      playername: this.playerName
    }

    this.http
      .post("http://localhost:"+this.myNodePort+"/joinGame", obj)
      .subscribe((response: any)=>{
  

      });
  }


  /**
   * Devuelve una partida
   * @param gamename:nombre de la partida
   */
  verPartida(gamename){
    console.log(gamename);   
    let obj = {
      gamename: gamename
    }


    this.http
      .post("http://localhost:"+this.myNodePort+"/getGame",obj)
      .subscribe((response: any)=>{
  
      console.log(response.partida);   

        if(response.status.localeCompare("error") != 0){
          this.actualGame = response.partida;
        }

      });
  }

  voltear(jugada){
    return jugada[2]+":"+jugada[0];
  }

  //Luego de hacer una jugada envia el objeto al otro jugador para que lo actualice
  sendPLay(playerindex, jugadaoriginal){

    //Quita la ficha del jugador
    let pieceindex = this.actualGame.pieces[playerindex].pieces.indexOf(jugadaoriginal);
    this.actualGame.pieces[playerindex].pieces.splice(pieceindex, 1);

    this.actualGame.turn = playerindex == 0 ? this.actualGame.pieces[1].port : this.actualGame.pieces[0].port;

    let obj ={
      game: this.actualGame,
      port: this.myNodePort,
    };

    this.http
    .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
    .subscribe((response: any)=>{

      //Una vez resuelto el post valida si el jugador ganó la partida
      if(this.actualGame.pieces[playerindex].pieces.length == 0){
        
        
        this.actualGame.status = 2;
        this.actualGame.winner = this.myNodePort;
        this.actualGame.winnername = this.playerName;

        let obj2 ={
          game: this.actualGame,
          playernotified: this.myNodePort
        };

        this.http
        .post("http://localhost:"+this.myNodePort+"/updateGame",obj2)
        .subscribe((response: any)=>{

        });

      }

    });

  }


  /**
   * Se hace una jugada
   */
  jugar(){

    //se debe validar que la ficha pertenece al jugador
    //se debe validar que la jugada es valida

    //si cumple las dos caracteristicas anteriores se hace la jugada (se actualiza el objeto actualGame)
    //y se notifica solo al otro jugador que no soy yo (o al owner o al visitor (son los numeros de los puertos ej: 10005))

    //se debe haber modificado actualGame antes de hacer esto

    if(this.actualGame.turn.localeCompare(this.myNodePort) == 0){

      let jugadaoriginal = this.myFormJugada.value.jugada
      let jugada = jugadaoriginal;
      this.myFormJugada.value.jugada='';
      let index = 0;
    

      //Valida el index del jugador
      if (this.actualGame.pieces[1].name.localeCompare(this.playerName) == 0 ){
        index = 1;
      }

      //Si poseo la ficha
      if (this.actualGame.pieces[index].pieces.includes(jugada)){

        let play ={
          port: this.myNodePort,
          name: this.playerName,
          piece: jugada,
        };

        //Si no hay jugadas
        if (this.actualGame.plays.length == 0){
          
          this.actualGame.plays.push(play);
          this.sendPLay(index, jugadaoriginal);

        }
        else 

        //Si hay una sola ficha en tablero
        if ( this.actualGame.plays.length == 1){

          let ficha_en_tablero = this.actualGame.plays[0].piece;
          if (jugada[2] == ficha_en_tablero[0]){

            this.actualGame.plays.unshift(play);
            this.sendPLay(index, jugadaoriginal);

          }
          else if (jugada[0] == ficha_en_tablero[0]){

            jugada = this.voltear(jugada);
            play.piece = jugada;
            this.actualGame.plays.unshift(play);
            this.sendPLay(index, jugadaoriginal);

          }
          else if (jugada[0] == ficha_en_tablero[2]){

            this.actualGame.plays.push(play);
            this.sendPLay(index, jugadaoriginal);
            
          }
          else if (jugada[2] == ficha_en_tablero[2]){

            jugada = this.voltear(jugada);
            play.piece = jugada;
            this.actualGame.plays.push(play);
            this.sendPLay(index, jugadaoriginal);
           
          }
          else {
            alert("Error: la ficha ingresada no coincide");
          }

        }
        else 

        //Si hay mas de una ficha en tablero
        if (this.actualGame.plays.length > 1){

          let primera_ficha = this.actualGame.plays[0].piece;
          let ultima_ficha = this.actualGame.plays[this.actualGame.plays.length - 1].piece;
         
          if (jugada[2] == primera_ficha[0]){

            this.actualGame.plays.unshift(play);
            this.sendPLay(index, jugadaoriginal);
            
          }
          else if (jugada[0] == primera_ficha[0]){

            jugada = this.voltear(jugada);
            play.piece = jugada;
            this.actualGame.plays.unshift(play);
            this.sendPLay(index, jugadaoriginal);

          }
          else if (jugada[0] == ultima_ficha[2]){

            this.actualGame.plays.push(play);
            this.sendPLay(index, jugadaoriginal);

          }
          else if (jugada[2] == ultima_ficha[2]){

            jugada = this.voltear(jugada);
            play.piece = jugada;
            this.actualGame.plays.push(play);
            this.sendPLay(index, jugadaoriginal);

          }
          else {
            alert("Error: la ficha ingresada no coincide");
          }

        }

      }

      //Si no poseo la ficha
      else{
        alert("Error: No posee la ficha ingresada.")
      }


    }else{
      alert("No es mi turno");
    }

    
  }


  rendirse(){

        this.actualGame.status = 2;
        this.actualGame.winner = this.myNodePort == this.actualGame.owner ? this.actualGame.visitor : this.actualGame.owner;
        this.actualGame.winnername = "Rendición de "+this.playerName;

        let obj ={
          game: this.actualGame,
          playernotified: this.myNodePort
        };

        this.http
        .post("http://localhost:"+this.myNodePort+"/updateGame",obj)
        .subscribe((response: any)=>{

        });

  }


}


