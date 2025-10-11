const hero = {name: "hero", HP: 52, attack: 8, defense: 7};
const enemy = {name: "enemy", HP: 35, attack: 6, defense: 5};

let heroIsDead = "false";
let enemyIsDead = "false";

function waitOneSecond() {
        setTimeout(() => {
        console.log("Waited 1 second");
        }, 1000);
}

function randomNum() {
    return Math.floor((Math.random() * 100) + 1)
}
randomNum();

function heroAttacks(waitOneSecond) {
    console.log("The hero attacks")
    waitOneSecond();

}



function battle(heroIsDead, enemyIsDead) {
    // while hero and enemy are alive
    if (!heroIsDead && !enemyIsDead) {
        console.log("Fight!");
        
        heroAttacks();


    }
    // if someone is dead...

};