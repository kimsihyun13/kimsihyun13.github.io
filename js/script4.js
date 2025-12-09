function hello4() {
    let msg = document.getElementById("msg4");

    if (msg.innerText === "") {
        msg.innerText = "가";  
    } else {
        msg.innerText = "";    
    }
}
