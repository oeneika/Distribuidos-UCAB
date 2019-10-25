import { Component, OnInit } from "@angular/core";
import { HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: "app-onepage",
  templateUrl: "./onepage.component.html",
  styleUrls: ["./onepage.component.css"]
})
export class OnepageComponent implements OnInit {
  myForm: FormGroup;

  constructor(
    public fb: FormBuilder,private http: HttpClient) {
    this.myForm = this.fb.group({
      jugada: ['', [Validators.required]],
    });
  }

  ngOnInit() {}

  jugar(){
    console.log(this.myForm.value);
  }

  unirmeAPartida(){
    console.log("Estoy en una partida");
  }

  cambiarDePartida(){
    console.log("Cambiando de partida");
  }

  CrearPartida(){
    console.log("Creando una partida");
  }


  registrarme(){
    console.log("Registro");
  }


  finalizar(){
    console.log("Finalizar partida");
  }

}
