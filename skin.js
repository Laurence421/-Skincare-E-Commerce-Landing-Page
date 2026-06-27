const menuBtn = document.querySelector('#menuBtn');
const items = document.querySelector('#menu');

menuBtn.addEventListener('click', () =>{
    items.classList.toggle('open-items');
});
items.addEventListener('click', () => {
    items.classList.remove('open-items')
});

