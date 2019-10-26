import { Component, OnInit } from "@angular/core";
import { HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbModal, ModalDismissReasons, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

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
  namePlayer = '';

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
    this.namePlayer = '';
  }

  ngOnInit() {}

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

  cambiarDePartida(){
    console.log("Cambiando de partida");
  }

  crearPartida(){
    console.log("Creando una partida");
    console.log(this.myFormCrearPartida.value);
    this.modalRef.close();
    //Llamamos al metodo que me trae las partidas activas
  }


  registrarse(){
    console.log("Registrando usuario");
    console.log(this.namePlayer);
    this.modalRef.close();
    //Enviamos el nombre al back
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
