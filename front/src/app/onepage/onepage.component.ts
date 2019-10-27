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

  ngOnInit() {}

  //Abre un modal
  open(content) {
    let options: NgbModalOptions = {
      size: 'lg',
      centered: true
    };

    this.modalRef = this.modalService.open(content, options);
  }


  jugar(){
    console.log("Realizando una jugada");
    console.log(this.myFormJugada.value);
  }

  unirmeAPartida(){
    console.log("Estoy en una partida");
  }

  
  //Trae todas las partidas
  traerPartidas(){

    this.http
      .get("http://localhost:"+this.myNodePort+"/getGames")
      .subscribe((response: any)=>{
  
      //console.log(response.partidas);   
      this.allGames = response.partidas;

      });

  }

  //Crea una partida
  crearPartida(){
    let gameName = this.myFormCrearPartida.value.nameGame;

    if(gameName){

      let object = {
        name: gameName,
        userId: this.myPlayerId 
      }
  
      this.http
      .post("http://localhost:"+this.myNodePort+"/checkgamename", object)
      .subscribe((response: any)=>{
  
       console.log(response);
  
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

  //Registra el nombre del usuario
  registrarse(){

    let object = {
      name: this.playerName,
      register: 1,
    }

    this.http
    .post("http://localhost:"+this.myNodePort+"/checkplayername", object)
    .subscribe((response: any)=>{

     console.log(response);

     if(response.status == "success"){
      this.myPlayerId = response.id;
      this.isValidPlayerName = true;
      this.traerPartidas();
      this.modalRef.close();
     }else{
        alert(response.message);
     }

    });

  }

  //Inicia
  iniciar(){

    let object = {
      name: this.playerName,
      register: 0
    }

    this.http
    .post("http://localhost:"+this.myNodePort+"/checkplayername", object)
    .subscribe((response: any)=>{

     console.log(response);

     if(response.status == "success"){
      this.myPlayerId = response.id;
      this.isValidPlayerName = true;
      this.traerPartidas();
      this.modalRef.close();
     }else{
        alert(response.message);
     }

    });

  }


  finalizar(){
    console.log("Finalizar partida");
  }

}


/* ESTE ES LA LOGICA DEL PROFESOR
export class OnepageComponent implements OnInit {

  localobj = {
    input1: "0",
    input2: "0",
    total: "0"
  };

  remoteobj = {
    input1: "0",
    input2: "0",
    total: "0"
  };

  constructor(private http: HttpClient) {

  }

  ngOnInit() {}

  add() {
    let trans = parseInt(this.localobj.input1) + parseInt(this.localobj.input2);
    this.localobj.total = trans + "";
  }

  sub() {
    let trans = parseInt(this.localobj.input1) - parseInt(this.localobj.input2);
    this.localobj.total = trans + "";
  }


  addRem() {

    this.http
    .post("http://localhost:10001/add", this.remoteobj)
    .subscribe((response: any)=>{

      this.remoteobj.input1 = response.input1;
      this.remoteobj.input2 = response.input2;
      this.remoteobj.total = response.total;

    });
  }

  subRem() {
    this.http
    .post("http://localhost:10001/sub", this.remoteobj)
    .subscribe((response: any)=>{
      this.remoteobj.input1 = response.input1;
      this.remoteobj.input2 = response.input2;
      this.remoteobj.total = response.total;

    });
  }

}


*/
