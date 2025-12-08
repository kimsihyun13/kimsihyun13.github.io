function hello4() {
    let msg = document.getElementById("msg4");

    if (msg.innerText === "") {
        msg.innerText = "는";   
    } else {
        msg.innerText = "";   
    }
}
