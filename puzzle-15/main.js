const cvs = document.getElementById('game')
const ctx = cvs.getContext('2d')
const moveAudio = new Audio('audio/move.mp3')
const movesBlock = document.getElementById('moves')
const timeBlock = document.getElementById('time')

const CELL_COUNT = 4
const CELL_WIDTH = cvs.width / CELL_COUNT

const playField = [], gameWinResult = []
const coords = []

let loadedBgImage = null, loadedRetryIcon = null
let hoveredItem = null
let gameOver = false
let retryBtnCoords = {}
let moves = 0, time = 0

cvs.addEventListener('mousemove', (e) => {
    const clientX = e.offsetX
    const clientY = e.offsetY

    if (stillOnHovered(clientX, clientY)) {
        return
    }

    hoveredItem = getHoveredItem(clientX, clientY)
})

cvs.addEventListener('mouseout', _ => {
    hoveredItem = null
})

cvs.addEventListener('click', e => {
    const clientX = e.offsetX
    const clientY = e.offsetY


    if (gameOver) {
        if (clientX > retryBtnCoords.x && clientX < retryBtnCoords.x + 150 &&
            clientY > retryBtnCoords.y && clientY < retryBtnCoords.y + 150) {
            gameOver = false
            moves = 0
            time = 0
            hoveredItem = null

            moveAudio.play();

            playField = []
            coords = []
            gameWinResult = []


            initPlayField()
        }
        return
    }

    moveAudio.play();

    if (stillOnHovered(clientX, clientY)) {

        const emptyCell = (playField[hoveredItem.row]?.[hoveredItem.col + 1] === 0 && { row: hoveredItem.row, col: hoveredItem.col + 1 } ||
            playField[hoveredItem.row]?.[hoveredItem.col - 1] === 0 && { row: hoveredItem.row, col: hoveredItem.col - 1 } ||
            playField[hoveredItem.row - 1]?.[hoveredItem.col] === 0 && { row: hoveredItem.row - 1, col: hoveredItem.col } ||
            playField[hoveredItem.row + 1]?.[hoveredItem.col] === 0 && { row: hoveredItem.row + 1, col: hoveredItem.col })

        if (emptyCell) {
            const currentN = playField[hoveredItem.row][hoveredItem.col]
            playField[hoveredItem.row][hoveredItem.col] = 0
            playField[emptyCell.row][emptyCell.col] = currentN
            hoveredItem = null

            moves++
            movesBlock.innerHTML = `<h3>Moves: ${moves}<h3>`

            gameOver = checkWin()
        }

    }
})

function formatSeconds(seconds) {
    const date = new Date(1970, 0, 1);
    date.setSeconds(seconds);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function getHoveredItem(clientX, clientY) {
    return coords.find((c) => {
        return (clientX > c.x) && (clientX < c.x + CELL_WIDTH) && (clientY > c.y) && (clientY < c.y + CELL_WIDTH)
    })
}

function stillOnHovered(clientX, clientY) {
    return hoveredItem &&
        (clientX > hoveredItem.x) &&
        (clientX < hoveredItem.x + CELL_WIDTH) &&
        (clientY > hoveredItem.y) &&
        (clientY < hoveredItem.y + CELL_WIDTH)
}

function drawBg(path = 'images/bg.png', dx = 0, dy = 0) {
    if (loadedBgImage) {
        ctx.drawImage(loadedBgImage, dx, dy)
        return
    }
    return new Promise((resolve) => {
        const bgImage = new Image()
        bgImage.src = path
        bgImage.onload = () => {
            loadedBgImage = bgImage
            ctx.drawImage(bgImage, dx, dy)
            resolve()
        }
    })
}

function loadImage(path) {
    return new Promise((resolve) => {
        const img = new Image()
        img.src = path
        img.onload = () => {
            resolve(img)
        }
    })
}

function initPlayField() {
    const existedNumbers = []
    let counter = 1

    for (let i = 0; i < CELL_COUNT; i++) {
        const row = [], winRow = []
        for (let j = 0; j < CELL_COUNT; j++) {
            while (row.length !== CELL_COUNT) {
                const n = Math.floor(Math.random() * 16)
                if (!existedNumbers.includes(n)) {
                    existedNumbers.push(n)
                    row.push(n)
                }
            }
            coords.push({ row: i, col: j, x: j * CELL_WIDTH, y: i * CELL_WIDTH })
            winRow.push(counter)
            counter++
        }
        gameWinResult.push(winRow)
        playField.push(row)
    }

    gameWinResult[gameWinResult.length - 1][CELL_COUNT - 1] = 0;
}

function gameOverScreen() {
    ctx.fillStyle = 'white'
    retryBtnCoords.x = (cvs.width - 150) / 2, retryBtnCoords.y = (cvs.height - 150) / 2
    ctx.fillRect(retryBtnCoords.x, retryBtnCoords.y, 150, 150)
    ctx.drawImage(loadedRetryIcon, (cvs.width - 100) / 2, (cvs.height - 90) / 2, 100, 90)
}

function checkWin() {
    for (let row = 0; row < playField.length; row++) {
        for (let col = 0; col < playField[row].length; col++) {
            if (playField[row][col] !== gameWinResult[row][col]) {
                return false;
            }
        }
    }
    return true
}

function drawPlayField() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    if (loadedBgImage) {
        drawBg()
    }
    // console.log(gameOver)
    if (gameOver) {
        gameOverScreen()
    } else {
        for (let row = 0; row < playField.length; row++) {
            for (let col = 0; col < playField[row].length; col++) {

                const dx = col * CELL_WIDTH
                const dy = row * CELL_WIDTH

                if (playField[row][col]) {

                    ctx.beginPath()

                    if (hoveredItem && hoveredItem.x === dx && hoveredItem.y === dy) {
                        ctx.fillStyle = 'yellow'
                    } else {
                        ctx.fillStyle = 'white'
                    }

                    ctx.rect(dx, dy, CELL_WIDTH, CELL_WIDTH)
                    ctx.fill()

                    ctx.strokeStyle = 'black'
                    ctx.stroke()

                    ctx.font = '50px monospace'
                    ctx.fillStyle = 'black'
                    ctx.textAlign = 'left'
                    ctx.textBaseline = 'top'

                    const txt = playField[row][col]
                    const measuredText = ctx.measureText(txt)
                    const offset = CELL_WIDTH - measuredText.width

                    ctx.fillText(playField[row][col], dx + offset / 2, dy + CELL_WIDTH / 4);
                }
            }
        }
    }
    requestAnimationFrame(drawPlayField)
}

async function drawBoard() {
    await drawBg()
    loadedRetryIcon = await loadImage('images/retry.png')
    initPlayField()
    drawPlayField()

    setInterval(() => {
        timeBlock.innerHTML = `<h3>Time: ${formatSeconds(++time)}</h3>`
    }, 1000)
}

drawBoard()