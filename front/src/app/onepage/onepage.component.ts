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
