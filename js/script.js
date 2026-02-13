function hello() {
    let msg = document.getElementById("msg1");

    if (msg.innerText === "") {
        msg.innerText = "살다 살다 별별 사람을 다 보네.";   
    } else {
        msg.innerText = "";    
    }
}
