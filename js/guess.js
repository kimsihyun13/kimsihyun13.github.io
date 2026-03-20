let answer = Math.floor(Math.random()*100)+1
let count = 0

function guess(){

    let input = document.getElementById("input").value
    let hint = document.getElementById("hint")

    count++

    if(input < answer){
        hint.innerText = "⬆ UP"
    }
    else if(input > answer){
        hint.innerText = "⬇ DOWN"
    }
    else{
        hint.innerText = "🎉 정답! 시도 횟수: " + count
    }

}

function resetGame(){

    answer = Math.floor(Math.random()*100)+1
    count = 0

    document.getElementById("hint").innerText = "새 게임 시작!"
    document.getElementById("input").value = ""

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
