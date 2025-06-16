document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById(burger.dataset.target);

  burger.addEventListener('click', function () {
    burger.classList.toggle('is-active');
    menu.classList.toggle('is-active');
  });
});
