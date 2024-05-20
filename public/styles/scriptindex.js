const boton = document.querySelector(".boton-subir");
boton.addEventListener("click", function() {
    window.scrollTo({
      top: document.querySelector("#encabezado").offsetTop,
      behavior: 'smooth',
      
    });
  });
  

 
  var ContratArray = []
  var dateArray = []
  let contratos_ = document.getElementById('contratos')
  let columnas = contratos_.children


  
  for (let index = 0; index < columnas.length; index++) {
      ContratArray.push(columnas[index])
  }
  console.log(ContratArray)
  console.log(dateArray)
  
  const pagina = document.getElementById('pag')
  const cantidad = document.getElementById('can')
  function recargar() {
      window.location.reload()
  }
  const lengthTabla = columnas.length -1
const separador_cantidad = async ()=>{
  let indexTabla = columnas.length-1
  let indexInsert = columnas.length-1
  
  
  console.log('este es el índice inicial de la tabla', indexTabla)
  console.log('esta es la longitud fija de la tabla', lengthTabla)
  let parentDiv = document.getElementById('contratos');
  console.log(parentDiv)
  console.log ('esta es la cantidad de contratos que se deben visualizar ', cantidad.options[cantidad.selectedIndex].value) 
  let columnas_contratos = []
  //vista de 10 elementos
       if(cantidad.options[cantidad.selectedIndex].value == 10 && indexTabla == lengthTabla){
          
              console.log(columnas.length)
              for (let index = 10; index < columnas.length; index){
              console.log('este es el indice de 10 ',index)
              let inicio = await columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio, columnas_contratos)
              console.log(columnas_contratos.lenght)
              }

              console.log('este es el índice final de la tabla', indexTabla)
          }else if(cantidad.options[cantidad.selectedIndex].value == 10 && indexTabla != lengthTabla){
              for (let i = indexInsert; i < lengthTabla; i++) {
                  console.log('indice ',i,'indice general ', indexInsert)
               await parentDiv.insertBefore(columnas[indexInsert], ContratArray[i].nextSibling)
              console.log('se ha insertado la columna ', columnas[indexInsert] ,'arreglo ', ContratArray[i])
              }
          console.log(columnas.length)
          for (let index = 10; index < columnas.length; index){
          console.log('este es el indice de 10 ',index)
          let inicio = await columnas[index].parentNode.removeChild(columnas[index])
          console.log ('se ha eliminado la columna ', inicio, columnas_contratos)
          console.log(columnas_contratos.lenght)
          }

          console.log('este es el índice final de la tabla', indexTabla)


  //vista de 20 elementos
          }else if(cantidad.options[cantidad.selectedIndex].value == 20 && indexTabla == lengthTabla){

              for (let index = 20; index < columnas.length; index){
              console.log('este es el indice de 20 ',index)
              let inicio = await columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }

              console.log('este es el índice final de la tabla', indexTabla)

          }else if(cantidad.options[cantidad.selectedIndex].value == 20  && indexTabla != lengthTabla){
              for (let i = indexInsert; i < lengthTabla; i++) {
                  console.log('indice ',i,'indice general ', indexInsert)
               await parentDiv.insertBefore(columnas[indexInsert], ContratArray[i].nextSibling)
              console.log('se ha insertado la columna ', columnas[indexInsert] ,'arreglo ', ContratArray[i])
              }

          console.log(columnas.length, ContratArray)
              for (let index = 20; index < columnas.length; index){
              console.log('este es el indice de 20 ',index)
              let inicio = await columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }

              console.log('este es el índice final de la tabla', indexTabla)


  //vista de 30 elementos
          }else if(cantidad.options[cantidad.selectedIndex].value == 30){
          console.log(columnas.length)
              for (let index = 30; index < columnas.length; index){
              console.log(index)
              let inicio = columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }
              
          }else if(cantidad.options[cantidad.selectedIndex].value == 30  && indexTabla != lengthTabla){
              for (let i = indexInsert; i < lengthTabla; i++) {
                  console.log('indice ',i,'indice general ', indexInsert)
               await parentDiv.insertBefore(columnas[indexInsert], ContratArray[i].nextSibling)
              console.log('se ha insertado la columna ', columnas[indexInsert] ,'arreglo ', ContratArray[i])
              }

          console.log(columnas.length, ContratArray)
              for (let index = 20; index < columnas.length; index){
              console.log('este es el indice de 20 ',index)
              let inicio = await columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }

              console.log('este es el índice final de la tabla', indexTabla)


  //vista de 50 elementos
          }else if(cantidad.options[cantidad.selectedIndex].value == 50){
          console.log(columnas.length)
              for (let index = 50; index < columnas.length; index){
              console.log(index)
              let inicio = columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }
          }else if(cantidad.options[cantidad.selectedIndex].value == 50  && indexTabla != lengthTabla){
              for (let i = indexInsert; i < lengthTabla; i++) {
                  console.log('indice ',i,'indice general ', indexInsert)
               await parentDiv.insertBefore(columnas[indexInsert], ContratArray[i].nextSibling)
              console.log('se ha insertado la columna ', columnas[indexInsert] ,'arreglo ', ContratArray[i])
              }

          console.log(columnas.length, ContratArray)
              for (let index = 20; index < columnas.length; index){
              console.log('este es el indice de 20 ',index)
              let inicio = await columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }

              console.log('este es el índice final de la tabla', indexTabla)

  //vista de 100 elementos
          }else if(cantidad.options[cantidad.selectedIndex].value == 100){
          console.log(columnas.length)
              for (let index = 100; index < columnas.length; index){
              console.log(index)
              let inicio = columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }
          }else if(cantidad.options[cantidad.selectedIndex].value == 100  && indexTabla != lengthTabla){
              for (let i = indexInsert; i < lengthTabla; i++) {
                  console.log('indice ',i,'indice general ', indexInsert)
               await parentDiv.insertBefore(columnas[indexInsert], ContratArray[i].nextSibling)
              console.log('se ha insertado la columna ', columnas[indexInsert] ,'arreglo ', ContratArray[i])
              }

          console.log(columnas.length, ContratArray)
              for (let index = 20; index < columnas.length; index){
              console.log('este es el indice de 20 ',index)
              let inicio = await columnas[index].parentNode.removeChild(columnas[index])
              columnas_contratos.push(inicio)
              console.log ('se ha eliminado la columna ', inicio)
              }

              console.log('este es el índice final de la tabla', indexTabla)

          }else if (cantidad.options[cantidad.selectedIndex].value == ''){
              window.location.reload()
          }
          console.log(columnas[10])
  }

  
 function separador_pagina(event){

  
  console.log(pagina.options[pagina.selectedIndex].value);

  console.log(cantidad.options[cantidad.selectedIndex].value);
  // if(cantidad.options[cantidad.selectedIndex].value == 10 && pagina.options[pagina.selectedIndex].value == 1){
  //             console.log(columnas.length)
  //         }else if(cantidad.options[cantidad.selectedIndex].value == 20){
  //         console.log(columnas.length)
  //             for (let index = 20; index < columnas.length; index){
  //             console.log(index)
  //             let inicio = columnas[index].parentNode.removeChild(columnas[index])
  //             console.log ('se ha eliminado la columna ', inicio)
  //             }
  //         }else if(cantidad.options[cantidad.selectedIndex].value == 30){
  //         console.log(columnas.length)
  //             for (let index = 30; index < columnas.length; index){
  //             console.log(index)
  //             let inicio = columnas[index].parentNode.removeChild(columnas[index])
  //             console.log ('se ha eliminado la columna ', inicio)
  //             }
  //         }else if(cantidad.options[cantidad.selectedIndex].value == 50){
  //         console.log(columnas.length)
  //             for (let index = 50; index < columnas.length; index){
  //             console.log(index)
  //             let inicio = columnas[index].parentNode.removeChild(columnas[index])
  //             console.log ('se ha eliminado la columna ', inicio)
  //             }
  //         }else if(cantidad.options[cantidad.selectedIndex].value == 100){
  //         console.log(columnas.length)
  //             for (let index = 100; index < columnas.length; index){
  //             console.log(index)
  //             let inicio = columnas[index].parentNode.removeChild(columnas[index])
  //             console.log ('se ha eliminado la columna ', inicio)
  //             }
  //      }
  
  }

  if(!(pagina.options[pagina.selectedIndex].value && cantidad.options[cantidad.selectedIndex].value)){
      cantidad.addEventListener("change", separador_cantidad);
  }
  pagina.addEventListener("change", separador_pagina)