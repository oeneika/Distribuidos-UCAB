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
    visitor: 0,
    winner: 0, //cuando un jugador gana se le notifica a toda la red (usar funcion modify game de server.js del back)
    winnername: "",
    plays: [], //(puerto del jugador, nombre del jugador, no definido)
    pieces: [] // se tendran dos objetos, uno para cada jugador
  };;

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
        name: gameName
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
      name: gamename
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

    let obj = {
      gamename: gamename
    }


    this.http
      .post("http://localhost:"+this.myNodePort+"/getGame",obj)
      .subscribe((response: any)=>{
  
      //console.log(response.partida);   

      this.actualGame = response.partida;

      });
  }
  voltear(jugada){
    let a = jugada[0];
    jugada [0] = jugada[2];
    jugada[2] = a;


    return jugada;
  }
  /**
   * Se hace una jugada
   */
  jugar(){

    let obj ={
      game: this.actualGame,
      port: this.myNodePort,
    };
    let jugada = this.myFormJugada.value.jugada;
    this.myFormJugada.value.jugada='';
    if (this.actualGame.pieces[0].name == this.playerName){
      if (this.actualGame.pieces[0].fichas.includes(jugada)){
        let object ={
          port: this.myNodePort,
          name: this.playerName,
          ficha: jugada,
        };
        if (this.actualGame.plays.length=== 0){
          
          this.actualGame.plays.push(object);
          obj.game = this.actualGame;
          this.http
            .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
            .subscribe((response: any)=>{
            });


        }
        else if ( this.actualGame.plays.length == 1){
          let ficha_jugada = this.actualGame.plays[0].ficha;
          if (jugada[2] == ficha_jugada[0]){
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == ficha_jugada[0]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == ficha_jugada[2]){
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[2] == ficha_jugada[2]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else {
            alert("Error: la ficha ingresada no coincide");
          }
        }
        else if (this.actualGame.plays.length > 1){
          let primera_ficha = this.actualGame.plays[0].ficha;
          let ultima_ficha = this.actualGame.plays[this.actualGame.plays.length - 1].ficha;
          let object ={
            port: this.myNodePort,
            name: this.playerName,
            ficha: jugada,
          };
          if (jugada[2] == primera_ficha[0]){
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == primera_ficha[0]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == ultima_ficha[2]){
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[2] == ultima_ficha[2]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else {
            alert("Error: la ficha ingresada no coincide");
          }

        }
      }
      else{
        alert("Error: No posee la ficha ingresada.")
      }
    }
    else if (this.actualGame.pieces[1].name == this.playerName){
      if (this.actualGame.pieces[1].fichas.includes(jugada)){
        let object ={
          port: this.myNodePort,
          name: this.playerName,
          ficha: jugada,
        };
        if (this.actualGame.plays.length == 0){
          
          this.actualGame.plays.push(object);
          obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
               });

        }
        else if ( this.actualGame.plays.length == 1){
          let ficha_jugada = this.actualGame.plays[0].ficha;
          if (jugada[2] == ficha_jugada[0]){
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == ficha_jugada[0]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == ficha_jugada[2]){
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[2] == ficha_jugada[2]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else {
            alert("Error: la ficha ingresada no coincide");
          }
        }
        else if (this.actualGame.plays.length > 1){
          let primera_ficha = this.actualGame.plays[0].ficha;
          let ultima_ficha = this.actualGame.plays[this.actualGame.plays.length - 1].ficha;
          let object ={
            port: this.myNodePort,
            name: this.playerName,
            ficha: jugada,
          };
          if (jugada[2] == primera_ficha[0]){
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == primera_ficha[0]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.unshift(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[0] == ultima_ficha[2]){
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else if (jugada[2] == ultima_ficha[2]){
            jugada = this.voltear(jugada);
            object.ficha = jugada;
            this.actualGame.plays.push(object);
            obj.game = this.actualGame;
            this.http
              .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
              .subscribe((response: any)=>{
              });
          }
          else {
            alert("Error: la ficha ingresada no coincide");
          }

        }
      }
      else{
        alert("Error: No posee la ficha ingresada.")
      }
    } 
    //se debe validar que la ficha pertenece al jugador
    //se debe validar que la jugada es valida

    //si cumple las dos caracteristicas anteriores se hace la jugada (se actualiza el objeto actualGame)
    //y se notifica solo al otro jugador que no soy yo (o al owner o al visitor (son los numeros de los puertos ej: 10005))

    //se debe haber modificado actualGame antes de hacer esto
    

  }
  
 


}


