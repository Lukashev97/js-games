const cvs = document.getElementById('game')
const ctx = cvs.getContext('2d')

// stats DOM
const statsTetromino = document.querySelector('.game-stats-tetromino')
const statsTotalScore = document.querySelector('.game-stats-totalscore')
const statsLines = document.querySelector('.game-stats-lines')
const statsLevel = document.querySelector('.game-stats-level')

let rAF = null

// resources
let retryBtnIcon = null

const game = {
    cellSize: 30,
    playField: [],
    rowCount: 20,
    colCount: 10,
    retryBlockBtn: { width: 140, height: 70, iconSize: 50 },
    gameOver: false,
    gameStats: {
        total: 0,
        lines: 0,
        nextTetromino: null
    },
    currentAcceleration: null,
    accLevels: {
        EASY: 60,
        NORMAL: 45,
        HARD: 30,
        FREE_FALL: 10,
    },
    tetrominos: {
        'I': [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        'O': [
            [1, 1],
            [1, 1]
        ],
        'S': [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        'Z': [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        'L': [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'J': [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'T': [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    tetrominoColors: {
        'I': '#00ffff',
        'O': '#ffff00',
        'S': '#ff0000',
        'J': '#0000ff',
        'L': '#ff7f00',
        'T': '#800080',
        'Z': '#00ff00'
    },
    rateSystem: {
        1: 40,
        2: 100,
        3: 300,
        4: 1200
    },
    levelSystem: {
        0: 'EASY',
        20: 'NORMAL',
        40: 'HARD'
    },
    currentSequence: [],
    currentTetromino: null,
    frameCounter: 0,
    async startGame() {
        if (!retryBtnIcon) {
            await this.loadResources()
        }
        this.initPlayField()
        this.generateSequence()
        this.currentTetromino = this.getNextTetromino()
        this.renderNextTetromino(this.currentTetromino.nextTetromino)
        this.renderTotalScore()
        this.initEvents()
        this.draw()
    },
    initEvents() {
        document.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowLeft':
                    const nextLeftCol = this.currentTetromino.col - 1
                    if (this.isMoveValid(this.currentTetromino.row, nextLeftCol)) {
                        this.currentTetromino.col--
                    }
                    break
                case 'ArrowRight':
                    const nextRightCol = this.currentTetromino.col + 1
                    if (this.isMoveValid(this.currentTetromino.row, nextRightCol)) {
                        this.currentTetromino.col++
                    }
                    break
                case 'ArrowUp':
                    const rotatedMatrix = this.rotateMatrix(this.currentTetromino.matrix)
                    if (this.isMoveValid(this.currentTetromino.row, this.currentTetromino.col, rotatedMatrix)) {
                        this.currentTetromino.matrix = rotatedMatrix
                    }
                    break
                case 'ArrowDown':
                    if (this.currentAcceleration !== this.accLevels.FREE_FALL) {
                        this.frameCounter = 0
                        this.currentAcceleration = this.accLevels.FREE_FALL
                    }
                    break
            }
        })

        document.addEventListener('keyup', e => {
            if (e.key === 'ArrowDown') {
                this.currentAcceleration = this.accLevels.EASY
            }
        })

        cvs.addEventListener('click', e => {
            if (this.gameOver) {
                const { x, y } = this.retryBlockBtn
                if (e.offsetX > x && (e.offsetX < x + this.retryBlockBtn.width) &&
                    e.offsetY > y && e.offsetY < (y + this.retryBlockBtn.height)) {
                    this.gameOver = false
                    this.resetGameState()
                }
            }
        })
    },
    resetGameState() {
        //cancelAnimationFrame(rAF)
        this.gameStats = { total: 0, lines: 0, nextTetromino: null }
        this.initPlayField()
    },
    rotateMatrix(matrix) {
        return matrix.map((row, i) => {
            return row.map((_, j) => matrix[matrix.length - 1 - j][i])
        })
    },
    initPlayField() {
        this.currentAcceleration = this.accLevels.EASY

        const { rowCount, colCount } = this

        this.playField = []
        for (let row = 0; row < rowCount; row++) {
            const tmpRow = []
            for (let col = 0; col < colCount; col++) {
                tmpRow.push(0)
            }
            this.playField.push(tmpRow)
        }
    },
    generateSequence() {
        const tetroNames = Object.keys(this.tetrominos)
        while (this.currentSequence.length !== tetroNames.length) {
            const randomName = tetroNames[Math.floor(Math.random() * tetroNames.length)]
            if (!this.currentSequence.includes(randomName)) {
                this.currentSequence.unshift(randomName)
            }
        }
    },
    getNextTetromino() {
        if (!this.currentSequence.length) {
            this.generateSequence()
        }

        const tetroName = this.currentSequence.shift()
        const matrix = this.tetrominos[tetroName]
        const initRow = tetroName === 'I' ? -1 : -2
        const initCol = this.playField[0].length / 2 - Math.ceil(matrix[0].length / 2);

        return {
            name: tetroName,
            row: initRow,
            col: initCol,
            matrix: this.tetrominos[tetroName],
            nextTetromino: this.currentSequence[0]
        }
    },
    isMoveValid(cellRow, cellCol, m) {
        const matrix = m || this.currentTetromino.matrix
        if (this.currentTetromino) {
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    if (matrix[row][col]) {
                        if (cellRow + row >= this.rowCount ||
                            cellCol + col < 0 ||
                            cellCol + col >= this.colCount ||
                            this.playField[cellRow + row]?.[cellCol + col]) {
                            return false
                        }
                    }
                }
            }
        }
        return true
    },
    gameOverScreen() {
        // GAME OVER TEXT
        ctx.font = '40px monospace'
        ctx.fillStyle = 'purple'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        this.renderText('Game Over')

        // TOTAL TEXT
        ctx.font = '20px monospace'
        ctx.fillStyle = 'yellow'
        const { gameStats: { total } } = this
        this.renderText(`Total: ${total}`, 90)


        // console.log(retryBtnIcon)

        ctx.fillStyle = 'orange'

        if (!this.retryBlockBtn.x && !this.retryBlockBtn.y) {
            this.retryBlockBtn = {
                ...this.retryBlockBtn,
                x: (cvs.width - this.retryBlockBtn.width) / 2,
                y: cvs.height / 2
            }
        }

        ctx.fillRect((cvs.width - this.retryBlockBtn.width) / 2, cvs.height / 2, this.retryBlockBtn.width, this.retryBlockBtn.height)

        ctx.fillStyle = 'white'

        ctx.drawImage(retryBtnIcon,
            (cvs.width - this.retryBlockBtn.iconSize) / 2,
            cvs.height / 1.94,
            50,
            50)
    },
    renderText(txt, height) {
        const offset = ctx.measureText(txt).width
        ctx.fillText(txt, (cvs.width - offset) / 2, (cvs.height - (height || offset)) / 2)
    },
    setUpTetromino() {

        for (let row = 0; row < this.currentTetromino.matrix.length; row++) {
            for (let col = 0; col < this.currentTetromino.matrix[row].length; col++) {
                if (this.currentTetromino.matrix[row][col]) {
                    if (this.currentTetromino.row + row <= 0) {
                        this.gameOver = true
                        return
                    }
                    this.playField[this.currentTetromino.row + row][this.currentTetromino.col + col] = this.currentTetromino.name
                }
            }
        }

        let row = this.rowCount - 1

        let scoreRows = 0

        while (row >= 0) {

            if (this.playField[row].every(col => col)) {
                for (let r = row; r >= 0; r--) {
                    for (let c = 0; c < this.playField[r].length; c++) {
                        this.playField[r][c] = this.playField[r - 1]?.[c]
                    }
                }
                scoreRows += 1
            } else {
                row--
            }

        }

        if (scoreRows) {
            this.gameStats.lines += scoreRows
            this.gameStats.total += this.rateSystem[scoreRows] 
        }

        this.currentTetromino = this.getNextTetromino()
        this.renderNextTetromino(this.currentTetromino.nextTetromino)
        this.renderTotalScore()

        if (this.levelSystem[this.gameStats.lines]) {
            this.currentAcceleration =  this.accLevels[this.levelSystem[this.gameStats.lines]]
        }
    },
    renderNextTetromino(tetroName) {
        if (tetroName) {
            const matrix = this.tetrominos[tetroName]

            let result = ''
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    if (matrix[row]?.[col]) {
                        const currentColor = this.tetrominoColors[tetroName]
                        result += `<div style="background-color: ${currentColor}"></div>`
                    } else {
                        result += '<div></div>'
                    }
                }
            }

            statsTetromino.innerHTML = result
        }
    },
    renderTotalScore() {
        const { gameStats: { total, lines } } = this
        statsTotalScore.innerHTML = `Total Score: <span>${total}<span>`
        statsLines.innerHTML = `Lines: <span>${lines}</span>`

        let currentLevel = null 

        if (lines >= 0 && lines < 20) {
            currentLevel = 'Easy'
        } else if (lines >= 20 && lines < 40) {
            currentLevel = 'Normal'
        } else {
            currentLevel = 'Hard'
        }

        statsLevel.innerHTML = `Level: ${currentLevel}`
    },
    async loadResources() {
        retryBtnIcon = await this.loadImage('images/retry.png')
    },
    loadImage(path) {
        return new Promise((resolve) => {
            const img = new Image()
            img.src = path
            img.onload = () => {
                resolve(img)
            }
        })
    },
    draw() {

        ctx.clearRect(0, 0, cvs.width, cvs.height)

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, cvs.width, cvs.height)

        if (!this.gameOver) {
            if (this.currentTetromino) {
                ++this.frameCounter
                if (this.frameCounter === this.currentAcceleration) {
                    this.currentTetromino.row++
                    this.frameCounter = 0
                }
                if (!this.isMoveValid(this.currentTetromino.row, this.currentTetromino.col)) {
                    this.currentTetromino.row--
                    this.setUpTetromino()
                }
                for (let row = 0; row < this.currentTetromino.matrix.length; row++) {
                    for (let col = 0; col < this.currentTetromino.matrix[row].length; col++) {
                        if (this.currentTetromino.matrix[row][col]) {
                            ctx.fillStyle = this.tetrominoColors[this.currentTetromino.name]
                            ctx.fillRect(
                                this.currentTetromino.col * this.cellSize + col * this.cellSize,
                                this.currentTetromino.row * this.cellSize + row * this.cellSize,
                                this.cellSize - 1,
                                this.cellSize - 1
                            )
                        }
                    }
                }
            }

            for (let row = 0; row < this.rowCount; row++) {
                for (let col = 0; col < this.colCount; col++) {
                    if (this.playField[row][col]) {
                        ctx.fillStyle = this.tetrominoColors[this.playField[row][col]]
                        ctx.fillRect(
                            col * this.cellSize,
                            row * this.cellSize,
                            this.cellSize - 1,
                            this.cellSize - 1
                        )
                    }
                }
            }
        } else {
            this.gameOverScreen()
        }

        rAF = requestAnimationFrame(this.draw.bind(this))
    }
}

game.startGame()