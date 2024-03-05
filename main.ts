type Piece = { x: number, y: number }
type Row = Array<boolean>
type Display = Array<Row>

const dData: Display = [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
]
const dot: Piece = { x: 2, y: 0 }
let speed: number = 500;

function refresh(display: Display, dot: Piece): void {
    for (let y = 0; y < 5; y += 1)
        for (let x = 0; x < 5; x += 1)
            if (display[y][x]) led.plot(x, y)
            else led.unplot(x, y);
    led.plot(dot.x, dot.y)
}

basic.forever(function() {
    refresh(dData, dot)
    
    //todo game
    dot.y = (dot.y + 1) % 5
    
    basic.pause(speed)
})