function hello8(event) {
    let btn = event.target;


    if (!btn.dataset.rotated) {
        btn.dataset.rotated = "0";
    }


    if (btn.dataset.rotated === "0") {
        btn.style.transform = "rotate(1440deg)";
        btn.dataset.rotated = "1";
    } else {
        btn.style.transform = "rotate(0deg)";
        btn.dataset.rotated = "0";
    }

    btn.style.transition = "1s";
}
