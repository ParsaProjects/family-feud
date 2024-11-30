class FamilyFeud {
    constructor() {
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.currentQuestion = null;
        this.revealedAnswers = new Set();
        this.strikes = 0;
        this.gameStarted = false;
        this.totalQuestions = 5;
        this.questionsPlayed = 0;
        this.usedQuestions = new Set();
        this.skippedQuestions = new Set();
        this.playerNames = { 1: 'Player 1', 2: 'Player 2' };

        // DOM Elements
        this.answerInput = document.getElementById('answer-input');
        this.submitButton = document.getElementById('submit-answer');
        this.startButton = document.getElementById('start-game');
        this.passButton = document.getElementById('pass');
        this.skipButton = document.getElementById('skip-question');
        this.questionElement = document.getElementById('current-question');
        this.questionCountInput = document.getElementById('question-count');
        this.player1NameInput = document.getElementById('player1-name');
        this.player2NameInput = document.getElementById('player2-name');
        this.questionsRemainingElement = document.getElementById('questions-remaining');
        this.gameSetupElement = document.getElementById('game-setup');
        this.gameBoardElement = document.getElementById('game-board');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoresElement = document.getElementById('final-scores');
        this.playAgainButton = document.getElementById('play-again');
        
        // Event Listeners
        this.startButton.addEventListener('click', () => this.startNewGame());
        this.submitButton.addEventListener('click', () => this.submitAnswer());
        this.passButton.addEventListener('click', () => this.passTurn());
        this.skipButton.addEventListener('click', () => this.skipQuestion());
        this.playAgainButton.addEventListener('click', () => this.showSetup());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });

        // Initialize UI
        this.updateUI();
        this.disableGameControls();
    }

    startNewGame() {
        // Get and validate player names
        const player1Name = this.player1NameInput.value.trim();
        const player2Name = this.player2NameInput.value.trim();
        
        if (!player1Name || !player2Name) {
            alert('Please enter names for both players');
            return;
        }
        
        this.playerNames = {
            1: player1Name,
            2: player2Name
        };

        const questionCount = parseInt(this.questionCountInput.value);
        if (isNaN(questionCount) || questionCount < 1 || questionCount > 20) {
            alert('Please enter a valid number of questions (1-20)');
            return;
        }

        this.totalQuestions = questionCount;
        this.questionsPlayed = 0;
        this.usedQuestions.clear();
        this.skippedQuestions.clear();
        this.gameStarted = true;
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.strikes = 0;
        this.revealedAnswers.clear();

        // Update player name displays
        document.querySelector('#player1 .player-name').textContent = this.playerNames[1];
        document.querySelector('#player2 .player-name').textContent = this.playerNames[2];

        this.gameSetupElement.style.display = 'none';
        this.gameBoardElement.style.display = 'block';
        this.gameOverElement.style.display = 'none';

        this.enableGameControls();
        this.updateStrikes();
        this.loadNewQuestion();
        this.updateUI();
        this.answerInput.focus();
    }

    loadNewQuestion() {
        // Get unused questions (excluding skipped ones)
        const availableQuestions = familyFeudQuestions.filter((_, index) => 
            !this.usedQuestions.has(index) && !this.skippedQuestions.has(index)
        );
        
        // If no new questions, try to use skipped questions
        if (availableQuestions.length === 0) {
            // If we have skipped questions and haven't reached the total, use them
            if (this.skippedQuestions.size > 0 && this.questionsPlayed < this.totalQuestions) {
                const skippedQuestionIndexes = Array.from(this.skippedQuestions);
                const randomSkippedIndex = Math.floor(Math.random() * skippedQuestionIndexes.length);
                const questionIndex = skippedQuestionIndexes[randomSkippedIndex];
                
                this.currentQuestion = familyFeudQuestions[questionIndex];
                this.skippedQuestions.delete(questionIndex);
                this.usedQuestions.add(questionIndex);
            } else {
                this.endGame();
                return;
            }
        } else {
            // Select random question from unused and unskipped questions
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            this.currentQuestion = availableQuestions[randomIndex];
            
            // Mark question as used
            const originalIndex = familyFeudQuestions.indexOf(this.currentQuestion);
            this.usedQuestions.add(originalIndex);
        }
        
        this.questionsPlayed++;
        this.revealedAnswers.clear();
        this.strikes = 0;
        this.updateStrikes();
        
        this.questionElement.textContent = this.currentQuestion.question;
        this.questionsRemainingElement.textContent = 
            `Question ${this.questionsPlayed} of ${this.totalQuestions}`;
        this.hideAllAnswers();
    }

    skipQuestion() {
        if (!this.gameStarted) return;
        
        // Add current question to skipped questions
        const currentIndex = familyFeudQuestions.indexOf(this.currentQuestion);
        this.skippedQuestions.add(currentIndex);
        
        // Remove from used questions since we're skipping it
        this.usedQuestions.delete(currentIndex);
        
        // Decrease questions played counter since we're skipping
        this.questionsPlayed--;
        
        // Load a new question
        this.loadNewQuestion();
        this.updateUI();
        this.answerInput.focus();
    }

    submitAnswer() {
        if (!this.gameStarted) return;

        const userAnswer = this.answerInput.value.trim().toLowerCase();
        this.answerInput.value = '';
        let found = false;

        this.currentQuestion.answers.forEach((answer, index) => {
            if (answer.text.toLowerCase() === userAnswer && !this.revealedAnswers.has(index)) {
                this.revealAnswer(index);
                this.scores[this.currentPlayer] += answer.points;
                found = true;
            }
        });

        if (!found) {
            this.addStrike();
        }

        this.updateUI();
        this.checkRoundEnd();
    }

    checkRoundEnd() {
        if (this.revealedAnswers.size === this.currentQuestion.answers.length) {
            this.revealedAnswers.clear();
            
            if (this.questionsPlayed >= this.totalQuestions) {
                this.endGame();
            } else {
                this.loadNewQuestion();
            }
            
            this.updateUI();
        }
    }

    endGame() {
        this.gameStarted = false;
        this.disableGameControls();
        
        const winner = this.scores[1] > this.scores[2] ? 1 : 
                      this.scores[1] < this.scores[2] ? 2 : 'Tie';
                      
        this.finalScoresElement.innerHTML = `
            <p>${this.playerNames[1]}: ${this.scores[1]} points</p>
            <p>${this.playerNames[2]}: ${this.scores[2]} points</p>
            <h3>${winner === 'Tie' ? "It's a Tie!" : this.playerNames[winner] + ' Wins!'}</h3>
        `;
        
        this.gameBoardElement.style.display = 'none';
        this.gameOverElement.style.display = 'block';
    }

    showSetup() {
        this.gameSetupElement.style.display = 'block';
        this.gameBoardElement.style.display = 'none';
        this.gameOverElement.style.display = 'none';
        this.player1NameInput.value = this.playerNames[1];
        this.player2NameInput.value = this.playerNames[2];
        this.player1NameInput.focus();
    }

    revealAnswer(index) {
        this.revealedAnswers.add(index);
        const answerElement = document.getElementById(`answer${index + 1}`);
        answerElement.querySelector('.text').style.visibility = 'visible';
        answerElement.querySelector('.points').style.visibility = 'visible';
        answerElement.querySelector('.text').textContent = this.currentQuestion.answers[index].text;
        answerElement.querySelector('.points').textContent = this.currentQuestion.answers[index].points;
    }

    hideAllAnswers() {
        for (let i = 1; i <= 4; i++) {
            const answerElement = document.getElementById(`answer${i}`);
            answerElement.querySelector('.text').style.visibility = 'hidden';
            answerElement.querySelector('.points').style.visibility = 'hidden';
        }
    }

    addStrike() {
        this.strikes++;
        this.updateStrikes();
        
        if (this.strikes >= 3) {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.strikes = 0;
            this.updateStrikes();
            this.updateUI();
            
            // Add visual feedback for turn change
            const turnIndicator = document.querySelector('.current-turn');
            turnIndicator.style.animation = 'none';
            turnIndicator.offsetHeight; // Trigger reflow
            turnIndicator.style.animation = null;
        }
    }

    updateStrikes() {
        const strikeElements = document.querySelectorAll('.strike');
        strikeElements.forEach((element, index) => {
            element.classList.toggle('active', index < this.strikes);
        });
    }

    switchPlayer() {
        if (this.strikes >= 3) {
            // When switching due to strikes, current player loses the round points
            this.roundPoints = 0;
        }
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.strikes = 0;
        this.updateStrikes();
        this.updateUI();
    }

    passTurn() {
        if (!this.gameStarted) return;
        
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.strikes = 0;
        this.updateStrikes();
        this.updateUI();
        this.answerInput.focus();
        
        // Add visual feedback for turn change
        const turnIndicator = document.querySelector('.current-turn');
        turnIndicator.style.animation = 'none';
        turnIndicator.offsetHeight; // Trigger reflow
        turnIndicator.style.animation = null;
    }

    updateUI() {
        // Update player scores
        document.querySelector('#player1 .score').textContent = this.scores[1];
        document.querySelector('#player2 .score').textContent = this.scores[2];
        
        // Update turn indicator
        document.querySelector('.current-turn').textContent = `${this.playerNames[this.currentPlayer]}'s Turn`;
        
        // Update active player highlighting
        document.querySelector('#player1').classList.toggle('active', this.currentPlayer === 1);
        document.querySelector('#player2').classList.toggle('active', this.currentPlayer === 2);
        
        // Update answer input placeholder
        this.answerInput.placeholder = `${this.playerNames[this.currentPlayer]}, enter your answer...`;
    }

    enableGameControls() {
        this.answerInput.disabled = false;
        this.submitButton.disabled = false;
        this.passButton.disabled = false;
        this.skipButton.disabled = false;
    }

    disableGameControls() {
        this.answerInput.disabled = true;
        this.submitButton.disabled = true;
        this.passButton.disabled = true;
        this.skipButton.disabled = true;
    }
}

// Initialize the game
const game = new FamilyFeud();
