class SocketClient {

  #socket = null
  #activePlayer = false

  constructor() {
    this.#socket = io()

    this.#socket.on('connect', this.onConnect.bind(this))
    this.#socket.on('error', this.onError.bind(this))
    this.#socket.on('start_game', this.onStartGame.bind(this))
    this.#socket.on('game_state_changed', this.onGameStateChange.bind(this))
    this.#socket.on('status', this.onStatus.bind(this))
  }

  get activePlayer() {
    return this.#activePlayer
  }

  onConnect() {
    console.log('Socket client has been connected...');
  }

  onError(error) {
    console.log(error);
  }

  onGameStateChange({ boardState, currentPlayer, message }) {
    console.log('onGameStateChange', boardState, currentPlayer, message);
    this.#activePlayer = this.#socket.id === currentPlayer
    game.renderGameField(boardState)
    game.statusBlock.innerHTML = this.#activePlayer ? 'It"s time to make a turn... ' : `
      <progress class="progress is-small is-primary" max="100">15%</progress></br>
      ${message}
    `
  }

  sendUserName(username) {
    this.#socket.emit('enter_username', username)
  }

  makeTurn(cellIdx) {
    this.#socket.emit('player_turn', { playerSign: game.playerSign, cellIdx })
  }

  onStartGame(playersData) {
    const currentPlayerData = playersData.find((p) => p.socketId === this.#socket.id)
    game.playerSign = currentPlayerData.sign
    game.gameContainer.innerHTML = ''
    game.renderGameField(currentPlayerData.boardState)

    this.#activePlayer = this.#socket.id === currentPlayerData.currentPlayer
    game.statusBlock.innerHTML = this.#activePlayer ? 'It"s time to make a turn... ' : `
      <progress class="progress is-small is-primary" max="100">15%</progress></br>
      ${currentPlayerData.message}
    `
  }

  handleNewGame() {
    this.#socket.emit('restart_game')
  }

  onStatus({ code, message }) {
    if (!code) {
      game.statusBlock.style.width = '100%'
      game.statusBlock.innerHTML = `
        <progress class="progress is-small is-primary" max="100">15%</progress></br>
      `
      game.gameContainer.innerHTML = `
        <p class="has-text-weight-semibold">${message}</p>
      `
      game.gameField.innerHTML = ''
    } else {
      game.statusBlock.innerHTML = ''
      game.gameContainer.innerHTML = `
        <div>
          <p class="has-text-weight-semibold mb-2">${message}</p>
          <button class="button is-danger mb-2" onclick="game.handleNewGame()" >New Game</button>
        </div>
      `
    }
  }

}

class Game {

  constructor() {
    this.gameContainer = document.getElementById('username_field')
    this.gameField = document.getElementById('game')
    this.statusBlock = document.getElementById('status')
    this.playerSign = null

    this.init()
  }

  init() {
    this.renderUserTextField()
  }

  renderUserTextField() {
    this.gameContainer.innerHTML = `
      <form onsubmit="game.submitUserName(event)">
          <div class="field">
            <label class="label">Username: </label>
            <div class="control">
              <input name="username" class="input" type="text" placeholder="Enter username" required />
            </div>
            <button class="button is-primary mt-2">
              Submit
            </button>
        </div>
      </form>
    `
  }

  renderGameField(boardState) {

    this.gameField.innerHTML = ''
    for (let i = 0; i < boardState.length; i++) {
      const cell = document.createElement('div')
      cell.setAttribute('data-id', i)
      cell.addEventListener('click', this.makeTurn.bind(this, i))
      if (['X', 'O'].includes(boardState[i])) {
        cell.innerHTML = `<span>${boardState[i]}</span>`
      }
      this.gameField.appendChild(cell)
    }
  }

  handleNewGame() {
    socketClient.handleNewGame()
  }

  makeTurn(cellIdx) {
    if (socketClient.activePlayer) {
      socketClient.makeTurn(cellIdx)
    }
  }

  submitUserName(event) {
    event.preventDefault()
    const username = event.target.username.value
    socketClient.sendUserName(username)
  }
}

// Get the instances of our classes described above
const socketClient = new SocketClient()
const game = new Game()