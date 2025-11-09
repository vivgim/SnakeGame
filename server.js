
const ws= require("ws");

const server = new ws.WebSocketServer({port:8085}, ()=>{
    console.log("servidor creado...");
});

//datos del juego
var jugadores = new Map(); // guardo: conexion, datos= datos del jugador
var siguienteId=0;

var fruta = null; //item fruta

function nuevaFruta() {
  return {
    posx: Math.floor(Math.random() * 480),
    posy: Math.floor(Math.random() * 480)
  };
}



server.addListener("connection", (conexionjugador)=>{
    console.log("alguien se ha conectado");
    
    //crear nuevo jugador
    
    datos={id:siguienteId,
        posx: Math.floor(Math.random()*480),
        posy: Math.floor(Math.random()*480),
        dir: "0",
        puntos: 0 };
    siguienteId++;

    jugadores.set(conexionjugador, datos);

    // si el primer jugador se conecta se hace fruta
if (jugadores.size === 1) {
  fruta = nuevaFruta();
  console.log("fruta creada con 1er jugador");
}

    //avisar a todos de que hay alguien nuevo
    jugadores.forEach((d, c)=>{ 

        c.send(
            JSON.stringify(
                {
                    tipo:  "new",
                    datos: datos,
                    puntos: datos.puntos
                }
            )
        );
    });

    //avisar al nuevo de la pos de los demas??
    jugadores.forEach((d,c)=>{
        if(c!==conexionjugador){
            conexionjugador.send(
                JSON.stringify({
                    tipo:"new",
                    datos:d,
                    puntos: d.puntos 
                })
            );
        }
    });





        //mandar info fruta a cada jugador

  if (fruta) {
    conexionjugador.send(JSON.stringify({ tipo: "fruta", datos: fruta }));
    
  }






    conexionjugador.addEventListener("close",()=>{
        console.log("alguien se ha desconectaodo");
        //buscar quien se ha desconectadp
        var datosdesconectados= jugadores.get(conexionjugador);
        //eliminarlo de a lista
        jugadores.delete(conexionjugador);
        //avisar a los demás
        jugadores.forEach((d,c)=>{
            c.send(
                JSON.stringify(
                    {
                        tipo: "delete",
                        datos: datosdesconectados.id
                    }
                )
            );
        });      
    });




    conexionjugador.addEventListener("message", (m)=>{
        mensaje=JSON.parse(m.data.toString());
        if (mensaje.tipo=="mover"){
            var datosDelJugador=jugadores.get(conexionjugador);
            var puntosJugador= datosDelJugador.puntos;

            //cambiar posicion segun tecla pulsada
            datosDelJugador=mensaje.datos;
            datosDelJugador.puntos=puntosJugador
            /*datosDelJugador={
                ...mensaje.datos,
                puntos: puntosJugador
            }*/

                //guardar info actualizada e informar a todo
                jugadores.set(conexionjugador,datosDelJugador);
                jugadores.forEach((d,c)=>{
                c.send(JSON.stringify({tipo:"mover",datos:datosDelJugador}));
            })

            if (fruta){
                var dx = datosDelJugador.posx - fruta.posx;
                var dy = datosDelJugador.posy - fruta.posy;
                var distancia = Math.sqrt(dx*dx+dy*dy); //pitagoras
                if (distancia < 20){
                    datosDelJugador.puntos= (datosDelJugador.puntos || 0) + 1;
                    console.log(datosDelJugador.id, " tiene ", datosDelJugador.puntos);
                    fruta=nuevaFruta();
                    jugadores.forEach ((d,c)=>{
                        c.send(JSON.stringify({tipo:"fruta", datos:fruta}));
                    });

                    // mandar puntos al jugador que se come la fruta
                    jugadores.forEach((d, c) => {
                        c.send(JSON.stringify({
                            tipo: "puntos",
                            datos: { id: datosDelJugador.id, puntos: datosDelJugador.puntos }
                        }));
                    });

                }
            }

        }//fin if

    });
});