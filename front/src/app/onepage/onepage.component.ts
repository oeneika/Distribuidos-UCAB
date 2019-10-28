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
    plays: [], //--> {port: , name: , ficha o jugada: } (puerto del jugador, nombre del jugador, no definido)
    pieces: [] //-> {port: , name: , fichas: [] } se tendran dos objetos, uno para cada jugador
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
    if(gameName){

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

  /**
   * Se hace una jugada
   */
  jugar(){

    //se debe validar que la ficha pertenece al jugador
    //se debe validar que la jugada es valida

    //si cumple las dos caracteristicas anteriores se hace la jugada (se actualiza el objeto actualGame)
    //y se notifica solo al otro jugador que no soy yo (o al owner o al visitor (son los numeros de los puertos ej: 10005))

    //se debe haber modificado actualGame antes de hacer esto
    let obj = {
      game: this.actualGame 
    }


    this.http
      .post("http://localhost:"+this.myNodePort+"/makePlay",obj)
      .subscribe((response: any)=>{
  

      });


  }
  
 


}


