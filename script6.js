let angle = 0;

function hello6(event) {
    angle += 360;
    event.target.style.transform = `rotate(${angle}deg)`;
    event.target.style.transition = "0.5s";
}
