function hello4() {
    let msg = document.getElementById("msg4");

    if (msg.innerText === "") {
        msg.innerText = "재";   
    } else {
        msg.innerText = "";    
    }
}
