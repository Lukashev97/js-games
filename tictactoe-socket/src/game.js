/**
 *  Main server logic of Tic Tac Toe
 *  TODO:
 *    - save results in database
 *    - leaderboard
 * */
class Game {
  #fieldSize // basically it's equaled to 3
  #boardState // current game board state
  #playersMap // includes connected socket instance, player sign and username
  #playerSign // it might be X or O
  #turnCount // turn counter, the maximal value is 9, we get started with 0
  #io // Socket IO instance that we're keeping for a whole life-circle period
  #currentPlayer // the sign of particular player who's making a turn

  /**
   *  Set board size, initialise player's Map and reset a board state
   * */
  constructor({ fieldSize = 3 } = {}) {
    this.#fieldSize = fieldSize
    this.#playersMap = new Map()
    this.#boardState = Array(this.#fieldSize ** 2).fill(null)
  }

  /**
   * This thing is used to get a cell quantity
   * */
  get cellCount() {
    return this.#fieldSize ** 2
  }

  /**
   * Method, which resets a board and fills it with NULL
   * */
  initTheBoardState = () => Array(this.cellCount).fill(null)

  /**
   * There's no something special, just trying barely a random power and obtain the first player sign
   * */
  getFirstPlayerSign = () => ['X', 'O'][Math.floor(Math.random() * 2)]

  /**
   * Each turn we check all possible winning cases and return boolean value depending on SOME function
   * */
  checkWinner = (board, player) => {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]              // Diagonals
    ]

    return winningCombos.some(combo =>
      combo.every(index => board[index] === player)
    )
  }

  /**
   *  Entry point to our application begins here
   *
   * */
  initSocketConnection(io) {
    this.#io = io

    io.on('connection', (socket) => {
      console.log(`User ${socket.id} has been connected`)

      if (this.#playersMap.size === 2) {
        socket.emit('status', { code: 0, message: 'The lobby is full. Try again later.' })
        socket.disconnect()
      } else {
        this.#playersMap.set(socket.id, { username: null, sign: null, socket })

        socket.on('enter_username', this.handleUserName(socket))
        socket.on('player_turn', this.handlePlayerTurn(socket))
        socket.on('disconnect', this.onPlayerDisconnect(socket))
        socket.on('restart_game', this.startNewGame(socket))
      }
    })
  }

  /**
   * Do not forget to reset the board state and turn counter before we start with the new game
   * */
  resetGameState = () => {
    this.#boardState = this.initTheBoardState()
    this.#turnCount = 0
    this.resetPlayersState()
  }

  /**
   * Prepare all needed info for connected client
   * */
  getInitGamePayload = () => {
    const socketIds = [...this.#playersMap.keys()]
    this.#currentPlayer = socketIds[Math.floor(Math.random() * 2)]

    const nextPlayer = this.#playersMap.get(this.#currentPlayer)

    return socketIds.map((socketId) => ({
      socketId,
      boardState: this.#boardState,
      sign: this.#playersMap.get(socketId)?.sign,
      currentPlayer: this.#currentPlayer,
      message: `Waiting for ${nextPlayer.username} turn`
    }))
  }

  /**
   * If player decides to play a new game then let him do that using the restart flag
   * */
  resetPlayersState = () => {
    this.#playersMap.forEach((player) => {
      player.restartFlag = false
    })
  }

  startNewGame = (socket) => () => {
    const currentPlayer = this.#playersMap.get(socket.id)
    currentPlayer.restartFlag = true

    const playerList = [...this.#playersMap.values()]
    if (playerList.every((player) => player.restartFlag)) {
      this.resetGameState()
      const payload = this.getInitGamePayload()
      this.#io.emit('start_game', payload)
    } else {
      socket.emit('status', { code: 0, message: 'Waiting for all players...' })
    }
  }

  handleUserName = (socket) => (username) => {
    console.log(`Username ${socket.id}: `, username);

    this.#playerSign = !this.#playerSign ? this.getFirstPlayerSign() : this.#playerSign === 'X' ? 'O' : 'X'

    console.log('Player sign: ', this.#playerSign)

    const currentPlayer = this.#playersMap.get(socket.id)
    currentPlayer.username = username
    currentPlayer.sign = this.#playerSign
    currentPlayer.restartFlag = false
    this.#playersMap.set(socket.id, currentPlayer)

    const playerList = [...this.#playersMap.values()]

    if (this.#playersMap.size === 2 && playerList.every((player) => player.username)) {
      const payload = this.getInitGamePayload()
      this.#io.emit('start_game', payload)
    } else {
      socket.emit('status', { code: 0, message: 'Still waiting for all players...' })
    }
  }

  handlePlayerTurn = (socket) => ({ playerSign, cellIdx }) => {
    const socketIds = [...this.#playersMap.keys()]

    this.#boardState[cellIdx] = playerSign
    this.#turnCount += 1
    this.#currentPlayer = socketIds.find((id) => socket.id !== id)

    const nextPlayer = this.#playersMap.get(this.#currentPlayer)

    this.#io.emit('game_state_changed', {
      boardState: this.#boardState,
      currentPlayer: this.#currentPlayer,
      message: `Waiting for ${nextPlayer.username} turn`
    })

    console.log('@Turn: ', this.#turnCount, ' @Cell Count: ', this.cellCount);

    if (this.checkWinner(this.#boardState, playerSign)) {
      const winner = this.#playersMap.get(socket.id)
      this.#io.emit('status', { code: 2, message: `Player ${winner.username} won the game!` })
    } else if (this.#turnCount === this.cellCount) {
      this.#io.emit('status', { code: 1, message: 'Draw!' })
    }
  }

  /**
   * If player disconnects therefore we must remove him from our Map and tell another player about that.
   * */
  onPlayerDisconnect = (socket) => () => {
    console.log(`User ${socket.id} has been disconnected`);
    const disconnectedSock = this.#playersMap.get(socket.id)
    this.#playerSign = disconnectedSock.sign === 'O' ? 'X' : 'O'
    this.#playersMap.delete(socket.id)
    this.resetGameState()
    this.#io.emit('status', { code: 0, message: 'Waiting for all players...' })
  }
}

module.exports = new Game()