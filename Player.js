class Player {
    constructor(name, color, position, life) {
        this.name = name;
        this.color = color;
        this.position = position; // position can be an object {x: 0, y: 0}
        this.life = life;
    }

    // Example method to move the player to a new position
    move(newPosition) {
        this.position = newPosition;
    }

    // Example method to change the player's life
    updateLife(lifeChange) {
        this.life += lifeChange;
    }
}
module.exports = Player;