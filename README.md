Pasos para probar el proyecto

1- Tener almenos dos copias del proyecto entero
2- Dependiendo de la cantidad de copias del proyecto se debe configurar el server.js dentro de la carpeta del back/nodo

  Ej: si tenemos dos nodos la configuracion del nodo 1 será: port=10001 y next=10002.
      Luego para el nodo dos la configuracion será: port=10002 y next=10001

3- En el controlador del front(angular) se debe configurar la varible myNodePort colocandole el numero del puerto de cada nodo
 Ej: para el nodo 1 myNodePort seria igual a 10001
 El controlador del front se encuentra en \front\src\app\onepage el archivo onepage.component
 
4- Debemos abrir Nx2 terminales como nodos tengamos (2 por cada nodo). 
    Una en front y otra en back/nodo
    En front ejecutar el comando ng serve el cual ejecuta el front. PD: El primer nodo se abrira en el puerto 4200 por defecto, pero cuando intentemos abrir el segundo nodo dará error al estar el puerto en uso, por lo cual debemos asignarle el puerto, la recomendacion seria ng serve --port=4300 para el nodo 2, ng serve --port=4400  para el nodo 3 y asi sucesivamente.
    En back/nodo ejecutar el comando node server.js el cual ejecuta el back
    
5-Una vez montado el servidor de angular debemos presionar el boton registrarse y poner un nombre. Todo lo que esta del lado derecho de la interfaz esta funcional, por otro lado, lo que esta del lado izquierdo no.
