function hello() {
    let msg = document.getElementById("msg1");

    if (msg.innerText === "") {
        msg.innerText = "현";   
    } else {
        msg.innerText = "";    
    }
}
