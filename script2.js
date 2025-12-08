function hello4() {
    let msg = document.getElementById("msg2");

    if (msg.innerText === "") {
        msg.innerText = "는";   
    } else {
        msg.innerText = "";   
    }
}
