const boton = document.querySelector(".boton-subir");
boton.addEventListener("click", function() {
    window.scrollTo({
      top: document.querySelector("#welcomers").offsetTop,
    });
  });

 