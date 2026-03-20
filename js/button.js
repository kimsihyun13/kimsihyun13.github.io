function hello() {
    let msg = document.getElementById("msg1");

    if (msg.innerText === "") {
        msg.innerText = "살다 살다 별별 사람을 다 보네.";   
    } else {
        msg.innerText = "";    
    }
}

function hello2() {
    let msg = document.getElementById("msg2");

    if (msg.innerText === "") {
        msg.innerText = "는";   
    } else {
        msg.innerText = "";   
    }
}

function hello3() {
    let msg = document.getElementById("msg3");

    if (msg.innerText === "") {
        msg.innerText = "재";   
    } else {
        msg.innerText = "";    
    }
}

function hello4() {
    let msg = document.getElementById("msg4");

    if (msg.innerText === "") {
        msg.innerText = "가";  
    } else {
        msg.innerText = "";    
    }
}

function hello5() {
    let msg = document.getElementById("msg5");

    if (msg.innerText === "") {
        msg.innerText = "려";  
    } else {
        msg.innerText = "";    
    }
}

function hello6(event) {
    let btn = event.target;


    if (!btn.dataset.rotated) {
        btn.dataset.rotated = "0";
    }


    if (btn.dataset.rotated === "0") {
        btn.style.transform = "rotate(360deg)";
        btn.dataset.rotated = "1";
    } else {
        btn.style.transform = "rotate(0deg)";
        btn.dataset.rotated = "0";
    }

    btn.style.transition = "0.5s";
}

function hello7(event) {
    let btn = event.target;


    if (!btn.dataset.rotated) {
        btn.dataset.rotated = "0";
    }


    if (btn.dataset.rotated === "0") {
        btn.style.transform = "rotate(360deg)";
        btn.dataset.rotated = "1";
    } else {
        btn.style.transform = "rotate(0deg)";
        btn.dataset.rotated = "0";
    }

    btn.style.transition = "0.5s";
}


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

function hello9(event) {
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




