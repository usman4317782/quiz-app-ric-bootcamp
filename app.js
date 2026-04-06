/**
 * Serverless MCQ Application Logic
 * Architecture: Singleton pattern for App state management
 */

const quizData = [
    {
        id: 1,
        question: "What is the primary purpose of a variable in programming?",
        options: [
            "To perform mathematical operations",
            "To store data in memory for later use",
            "To create user interfaces",
            "To connect to a database"
        ],
        answer: 1 // Index of correct option
    },
    {
        id: 2,
        question: "Which of the following is NOT a fundamental data type in most programming languages?",
        options: ["Integer", "Boolean", "Array", "Internet"],
        answer: 3
    },
    {
        id: 3,
        question: "What does a 'for loop' primarily do?",
        options: [
            "Defines a new function",
            "Executes a block of code a specific number of times",
            "Checks if a condition is true or false",
            "Imports external libraries"
        ],
        answer: 1
    },
    {
        id: 4,
        question: "In programming, what is a syntax error?",
        options: [
            "An error caused by a broken keyboard",
            "A logical flaw that produces the wrong output",
            "A violation of the grammatical rules of the programming language",
            "An error that only occurs when the internet is disconnected"
        ],
        answer: 2
    },
    {
        id: 5,
        question: "What is an algorithm?",
        options: [
            "A step-by-step set of instructions to solve a problem",
            "A physical component of a computer",
            "A type of computer virus",
            "A programming language used for styling websites"
        ],
        answer: 0
    }
];

// Application State
const state = {
    currentQuestionIndex: 0,
    score: 0,
    timeLeft: 20,
    timerInterval: null,
    selectedOptionIndex: null,
    isAnswered: false,
    history: []
};

// DOM Elements
const elements = {
    html: document.documentElement,
    themeToggle: document.getElementById('darkModeToggle'),
    
    // Views
    startScreen: document.getElementById('start-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    
    // Quiz Elements
    startBtn: document.getElementById('start-btn'),
    nextBtn: document.getElementById('next-btn'),
    restartBtn: document.getElementById('restart-btn'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    tracker: document.getElementById('question-tracker'),
    progressBar: document.getElementById('progress-bar'),
    timeLeft: document.getElementById('time-left'),
    
    // Result Elements
    finalScore: document.getElementById('final-score'),
    scoreMessage: document.getElementById('score-message'),
    historyList: document.getElementById('history-list')
};

// --- Initialization ---
function init() {
    loadThemePreference();
    loadHistory();
    attachEventListeners();
}

function attachEventListeners() {
    elements.themeToggle.addEventListener('change', toggleTheme);
    elements.startBtn.addEventListener('click', startQuiz);
    elements.nextBtn.addEventListener('click', handleNext);
    elements.restartBtn.addEventListener('click', resetQuiz);
}

// --- Theme Management ---
function loadThemePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    elements.themeToggle.checked = isDark;
    elements.html.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
}

function toggleTheme(e) {
    const isDark = e.target.checked;
    elements.html.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDark);
}

// --- Quiz Logic ---
function startQuiz() {
    state.currentQuestionIndex = 0;
    state.score = 0;
    switchView(elements.startScreen, elements.quizScreen);
    renderQuestion();
}

function renderQuestion() {
    const q = quizData[state.currentQuestionIndex];
    
    // Reset state for new question
    state.selectedOptionIndex = null;
    state.isAnswered = false;
    elements.nextBtn.disabled = true; // Constraint: must attempt before moving forward
    
    // Update UI
    elements.tracker.innerText = `Question ${state.currentQuestionIndex + 1}/${quizData.length}`;
    elements.progressBar.style.width = `${((state.currentQuestionIndex) / quizData.length) * 100}%`;
    elements.questionText.innerText = q.question;
    elements.optionsContainer.innerHTML = '';

    // Render Options
    q.options.forEach((optionText, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn w-100';
        btn.innerText = optionText;
        btn.onclick = () => selectOption(index, btn);
        elements.optionsContainer.appendChild(btn);
    });

    startTimer();
}

function selectOption(index, btnElement) {
    if (state.isAnswered) return; // Prevent changing answer if locked

    // Visually update selection
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');

    // Update State
    state.selectedOptionIndex = index;
    elements.nextBtn.disabled = false; // Enable next button
}

function handleNext() {
    clearInterval(state.timerInterval);
    state.isAnswered = true; // Lock in

    // Calculate score
    const q = quizData[state.currentQuestionIndex];
    if (state.selectedOptionIndex === q.answer) {
        state.score++;
    }

    // Progress logic
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < quizData.length) {
        renderQuestion();
    } else {
        endQuiz();
    }
}

// --- Timer Logic ---
function startTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = 20;
    elements.timeLeft.innerText = state.timeLeft;

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        elements.timeLeft.innerText = state.timeLeft;

        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    // If time runs out and no option selected, automatically mark wrong and force next
    if (state.selectedOptionIndex === null) {
        state.selectedOptionIndex = -1; // Explicitly wrong
    }
    handleNext();
}

// --- Results & Storage Logic ---
function endQuiz() {
    elements.progressBar.style.width = '100%';
    saveRecord();
    renderHistory();
    
    elements.finalScore.innerText = `${state.score} / ${quizData.length}`;
    
    // Dynamic message based on score
    const percentage = state.score / quizData.length;
    if (percentage === 1) elements.scoreMessage.innerText = "Perfect! You're a programming wizard.";
    else if (percentage >= 0.6) elements.scoreMessage.innerText = "Good job! You know your fundamentals.";
    else elements.scoreMessage.innerText = "Keep studying! Fundamentals take practice.";

    switchView(elements.quizScreen, elements.resultScreen);
}

function resetQuiz() {
    switchView(elements.resultScreen, elements.startScreen);
}

function saveRecord() {
    const record = {
        date: new Date().toLocaleString(),
        score: state.score,
        total: quizData.length
    };
    state.history.unshift(record); // Add to beginning
    if(state.history.length > 5) state.history.pop(); // Keep only last 5 attempts
    localStorage.setItem('quizHistory', JSON.stringify(state.history));
}

function loadHistory() {
    const saved = localStorage.getItem('quizHistory');
    if (saved) {
        state.history = JSON.parse(saved);
    }
}

function renderHistory() {
    elements.historyList.innerHTML = '';
    if (state.history.length === 0) {
        elements.historyList.innerHTML = '<li class="list-group-item bg-transparent text-muted px-0">No past attempts found.</li>';
        return;
    }
    
    state.history.forEach((record, index) => {
        const li = document.createElement('li');
        li.className = 'list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span class="text-muted small">${record.date}</span>
            <span class="badge ${record.score >= (record.total/2) ? 'bg-success' : 'bg-warning text-dark'} rounded-pill">
                ${record.score} / ${record.total}
            </span>
        `;
        elements.historyList.appendChild(li);
    });
}

// --- Utility ---
function switchView(hideElement, showElement) {
    hideElement.classList.add('d-none');
    hideElement.classList.remove('active');
    
    showElement.classList.remove('d-none');
    // small timeout to allow display:block to apply before adding animation class
    setTimeout(() => showElement.classList.add('active'), 10);
}

// Boot the app
document.addEventListener('DOMContentLoaded', init);