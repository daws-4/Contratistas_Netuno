const boton = document.querySelector(".boton");
boton.addEventListener("click", function() {
    window.scrollTo({
      top: document.querySelector("#hero").offsetTop,
    });
  });