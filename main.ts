const frequence = 60
const startingTime = 3000
const rotationDirection = 90 // 90 - CCW, -90 - CW
const scoreTable = {
    one: 5,
    two: 15,
    three: 25
}

const dropTimeTable = {
    under40: 2000,
    under80: 1200,
    under100: 800
}

type Point = {
    x: number,
    y: number
}

type Shape = {
    shape: string,
    points: Array<Point>,
    pivotPoint: Point
}

enum State {
    Play,
    Win,
    Lost,
    ScoreWin,
    ScoreLost
}

enum InputType {
    A,
    B,
    Logo
}

function display(gamePlotArray: Array<Array<boolean>>): void {
    gamePlotArray.forEach((yArray, y) => {
        yArray.forEach((xValue, x) => {
            if (xValue) {
                led.plot(x, y)
            } else {
                led.unplot(x, y)
            }
        })
    })
}

function generateShape(): Shape {
    const avalibleShapes = ["I", "O", "L", "J"]
    const chosenShape = avalibleShapes[Math.round(Math.random() * (avalibleShapes.length - 1))]
    let points = []
    let pivotPoint
    if (chosenShape === "I") {
        points.push({
            x: 1,
            y: 0
        })
        points.push({
            x: 2,
            y: 0
        })
        points.push({
            x: 3,
            y: 0
        })
        pivotPoint = {
            x: 2,
            y: 0
        }
    } else if (chosenShape === "O") {
        points.push({
            x: 1,
            y: 0
        })
        points.push({
            x: 2,
            y: 0
        })
        points.push({
            x: 1,
            y: 1
        })
        points.push({
            x: 2,
            y: 1
        })
        pivotPoint = {
            x: 1.5,
            y: 0.5
        }
    } else if (chosenShape === "L") {
        points.push({
            x: 2,
            y: 0
        })
        points.push({
            x: 3,
            y: 0
        })
        points.push({
            x: 2,
            y: 1
        })
        pivotPoint = {
            x: 2.5,
            y: 0.5
        }
    } else if (chosenShape === "J") {
        points.push({
            x: 2,
            y: 0
        })
        points.push({
            x: 3,
            y: 0
        })
        points.push({
            x: 3,
            y: 1
        })
        pivotPoint = {
            x: 2.5,
            y: 0.5
        }
    }
    return {
        shape: chosenShape,
        points: points,
        pivotPoint: pivotPoint
    }
}

function plotShape(gamePlotArray: Array<Array<boolean>>, currentShape: Shape): Array<Array<boolean>> {
    let newGamePlotArray = [
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false]
    ]
    gamePlotArray.forEach((yArray, y) => {
        yArray.forEach((xValue, x) => {
            if (xValue) {
                newGamePlotArray[y][x] = true
            }
        })
    })
    currentShape.points.forEach((value) => {
        newGamePlotArray[value.y][value.x] = true
    })
    return newGamePlotArray
}

function checkCollision(gamePlotArray: Array<Array<boolean>>, currentShape: Shape): boolean {
    let isColliding = false
    currentShape.points.forEach((value) => {
        if (value.x < 0 || value.x > 4 || value.y < 0 || value.y > 4 || gamePlotArray[value.y][value.x]) {
            isColliding = true
        }
    })
    return isColliding
}

function copy(currentShape: Shape): Shape {
    let points: Array<Point> = []
    currentShape.points.forEach((value) => {
        points.push({
            x: value.x,
            y: value.y
        })
    })
    return {
        shape: currentShape.shape,
        points: points,
        pivotPoint: {
            x: currentShape.pivotPoint.x,
            y: currentShape.pivotPoint.y
        }
    }
}

function dropBlock(gamePlotArray: Array<Array<boolean>>, currentShape: Shape): { currentShape: Shape, gamePlotArray: Array<Array<boolean>> } {
    const beforeMoveShape = copy(currentShape)
    currentShape.points.forEach((value) => {
        value.y += 1
    })
    currentShape.pivotPoint.y += 1
    if (checkCollision(gamePlotArray, currentShape)) {
        gamePlotArray = removeLine(plotShape(gamePlotArray, beforeMoveShape))
        currentShape = processNewShape(gamePlotArray)
    }
    return { currentShape, gamePlotArray }
}

function removeLine(gamePlotArray: Array<Array<boolean>>): Array<Array<boolean>> {
    let fullLines: Array<number> = []
    gamePlotArray.forEach((yArray, y) => {
        let line = [false, false, false, false, false]
        yArray.forEach((xValue, x) => {
            if (xValue) {
                line[x] = gamePlotArray[y][x]
            }
        })
        let isFullLine = line.every((value) => {
            return value
        })
        if (isFullLine) {
            fullLines.push(y)
        }
    })
    switch (fullLines.length) {
        case 1: {
            score += scoreTable.one
            break
        }
        case 2: {
            score += scoreTable.two
            break
        }
        case 3: {
            score += scoreTable.three
            break
        }
    }

    score = Math.min(score, 99)

    fullLines.forEach((value) => {
        gamePlotArray[value] = [false, false, false, false, false]
        for (let i = value; i > 0; i--) {
            gamePlotArray[i] = gamePlotArray[i - 1]
        }
    })
    return gamePlotArray
}

function rotation(currentShape: Shape, angle: number): Shape {
    // Rotation Matrix
    const angleInRad = angle * Math.PI / 180
    currentShape.points.forEach((value, index) => {
        const relativeX = currentShape.pivotPoint.x - value.x
        const relativeY = currentShape.pivotPoint.y - value.y
        const rotatedX = relativeX * Math.cos(angleInRad) - relativeY * Math.sin(angleInRad)
        const rotatedY = relativeX * Math.sin(angleInRad) + relativeY * Math.cos(angleInRad)
        value.x = Math.round(currentShape.pivotPoint.x + rotatedX)
        value.y = Math.round(currentShape.pivotPoint.y + rotatedY)
    })
    return currentShape
}

function moveOnXBy(gamePlotArray: Array<Array<boolean>>, currentShape: Shape, move: number): Shape {
    const beforeMoveShape = copy(currentShape)
    currentShape.points.forEach((value) => {
        value.x += move
    })
    currentShape.pivotPoint.x += move
    if (checkCollision(gamePlotArray, currentShape)) {
        return beforeMoveShape
    }
    return currentShape
}

function updateState(newState: State): void {
    if (newState === State.Play) {
        score = 0
        playedGames += 1
        lastDrop = control.millis() + startingTime
        gameStartTime = control.millis()
        globalGamePlotArray = [
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false]
        ]
        globalCurrentShape = processNewShape(globalGamePlotArray)
    }
    gameState = newState
}

function processNewShape(gamePlotArray: Array<Array<boolean>>): Shape {
    let currentShape = generateShape()
    const isColliding = checkCollision(gamePlotArray, currentShape)
    if (isColliding) {
        updateState(State.Lost)
    }
    return currentShape
}

let score = 0
let playedGames = 0
let lastDrop = control.millis() + startingTime
let gameStartTime = control.millis()
let gameState = State.Play
let globalGamePlotArray = [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false]
]
let globalCurrentShape: Shape = processNewShape(globalGamePlotArray)
basic.forever(function () {
    if (control.millis() - gameStartTime < startingTime) {
        whaleysans.showNumber(playedGames)
        return
    }
    switch (gameState) {
        case State.Play: {
            if (score === 99) {
                updateState(State.Win)
                break
            }
            display(plotShape(globalGamePlotArray, globalCurrentShape))
            let dropTime
            if (score < 40) {
                dropTime = dropTimeTable.under40
            } else if (score < 80) {
                dropTime = dropTimeTable.under80
            } else {
                dropTime = dropTimeTable.under100
            }
            if (control.millis() - lastDrop > dropTime) {
                const output = dropBlock(globalGamePlotArray, globalCurrentShape)
                globalCurrentShape = output.currentShape
                globalGamePlotArray = output.gamePlotArray
                lastDrop = control.millis()
            }
            break
        }
        case State.Win: {
            basic.showIcon(IconNames.Happy)
            break
        }
        case State.Lost: {
            display(plotShape(globalGamePlotArray, globalCurrentShape))
            break
        }
        case State.ScoreWin: {
            whaleysans.showNumber(score)
            break
        }
        case State.ScoreLost: {
            whaleysans.showNumber(score)
            break
        }
    }

    basic.pause(1 / frequence)
})

function processInput(buttonType: InputType, gamePlotArray: Array<Array<boolean>>, currentShape: Shape): Shape {
    switch (gameState) {
        case State.Play: {
            switch (buttonType) {
                case InputType.A: {
                    currentShape = moveOnXBy(gamePlotArray, currentShape, -1)
                    break
                }
                case InputType.B: {
                    currentShape = moveOnXBy(gamePlotArray, currentShape, 1)
                    break
                }
                case InputType.Logo: {
                    const beforeMoveShape = copy(currentShape)
                    currentShape = rotation(currentShape, rotationDirection)
                    if (checkCollision(gamePlotArray, currentShape)) {
                        currentShape = beforeMoveShape
                    }
                    break
                }
            }
            break
        }
        case State.Win: {
            updateState(State.ScoreWin)
            break
        }
        case State.Lost: {
            updateState(State.ScoreLost)
            break
        }
        case State.ScoreWin: {
            updateState(State.Win)
            break
        }
        case State.ScoreLost: {
            updateState(State.Lost)
            break
        }
    }
    return currentShape
}

input.onButtonPressed(Button.A, function () {
    if (control.millis() - gameStartTime < startingTime) {
        return
    }
    globalCurrentShape = processInput(InputType.A, globalGamePlotArray, globalCurrentShape)
})

input.onButtonPressed(Button.B, function () {
    if (control.millis() - gameStartTime < startingTime) {
        return
    }
    globalCurrentShape = processInput(InputType.B, globalGamePlotArray, globalCurrentShape)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (control.millis() - gameStartTime < startingTime) {
        return
    }
    switch (gameState) {
        case State.Play: {
            globalCurrentShape = processInput(InputType.Logo, globalGamePlotArray, globalCurrentShape)
            break
        }
        default: {
            updateState(State.Play)
            break
        }
    }
})