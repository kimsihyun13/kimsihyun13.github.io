function hello4() {
    let msg = document.getElementById("msg1");

    if (msg.innerText === "") {
        msg.innerText = "가";   
    } else {
        msg.innerText = "";    
    }
}
