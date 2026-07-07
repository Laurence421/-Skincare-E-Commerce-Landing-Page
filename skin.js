const menuBtn = document.querySelector('#menuBtn');
const items = document.querySelector('#menu');
menuBtn.addEventListener('click', () =>{
    items.classList.toggle('open-items');
});

document.querySelector('main').addEventListener('click', () =>{
    items.classList.remove('open-items');
});
let lastScrollTop = 0;

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop) {

    items.classList.remove('open-items');

  }

  // Prevent negative scrolling bugs on mobile devices
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; 
});

const timer = document.querySelector('#clock');

let totalSeconds = 12 * 30 * 56;
function update(){
    let hr = Math.floor((totalSeconds / 3600));
    let mn = Math.floor((totalSeconds % 3600 / 60));
    let sec = totalSeconds % 60;

    hr = String(hr).padStart(2,'0');
    mn = String(mn).padStart(2,'0');
    sec = String(sec).padStart(2,'0');

    timer.textContent = `${hr}hrs ${mn}mins ${sec}sec`;
}

const timerId = setInterval (() =>{
    if (totalSeconds <= 0) {
        clearInterval(timerId);
        timer.textContent = "Time's up!";
        return
    }
    totalSeconds--;
    update();
}, 1000);
