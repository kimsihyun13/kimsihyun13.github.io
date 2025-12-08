function hello5() {
    let msg = document.getElementById("msg5");

    if (msg.innerText === "") {
        msg.innerText = "려";  
    } else {
        msg.innerText = "";    
    }
}
