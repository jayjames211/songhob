var WIN_SCORE = 40;
var INIT_SEEDS = 5;

var gameBoard = [];
var scores = [0, 0];
var currentPlayer = 0;
var gameActive = true;
var gameOver = false;
var gameMode = "pvp";
var aiLevel = "medium";
var timerInterval = null;
var gameStartTime = null;
var currentDuration = 0;
var nordName = "NORD";
var sudName = "SUD";
var animationLock = false;
var isPaused = false;
var captureHistory = [];

var rangeeNord, rangeeSud, toast, modalAide, modalFin;
var tourNomSpan, grainNordSpan, grainSudSpan, chronoDisplay;

document.addEventListener("DOMContentLoaded", function() {
    rangeeNord = document.getElementById("rangeeNord");
    rangeeSud = document.getElementById("rangeeSud");
    toast = document.getElementById("toast");
    modalAide = document.getElementById("modalAide");
    modalFin = document.getElementById("modalFin");
    tourNomSpan = document.getElementById("tourNom");
    grainNordSpan = document.getElementById("grainNord");
    grainSudSpan = document.getElementById("grainSud");
    chronoDisplay = document.getElementById("chronoDisplay");
    
    var menuScreen = document.getElementById("screenMenu");
    var gameScreen = document.getElementById("screenGame");
    var scoresScreen = document.getElementById("screenScores");
    
    document.getElementById("btnStartGame").addEventListener("click", startGameFromMenu);
    document.getElementById("btnMenuScores").addEventListener("click", function() { 
        renderScoresList();
        showScreen(scoresScreen); 
    });
    document.getElementById("btnMenuHelp").addEventListener("click", function() { openModal(modalAide); });
    document.getElementById("themeToggleMenu").addEventListener("click", toggleTheme);
    document.getElementById("btnBackMenu").addEventListener("click", function() {
        stopTimer();
        showScreen(menuScreen);
    });
    document.getElementById("btnGameHelp").addEventListener("click", function() { openModal(modalAide); });
    document.getElementById("btnRestart").addEventListener("click", restartGame);
    document.getElementById("btnThemeGame").addEventListener("click", toggleTheme);
    document.getElementById("btnBackFromScores").addEventListener("click", function() { showScreen(menuScreen); });
    document.getElementById("btnExportJSON").addEventListener("click", exportScoresToJSON);
    document.getElementById("btnClearScores").addEventListener("click", function() {
        if(confirm("Effacer tout l'historique ?")) {
            clearScores();
            renderScoresList();
            showToast("Historique efface");
        }
    });
    document.getElementById("btnFinRestart").addEventListener("click", function() {
        closeModal(modalFin);
        restartGame();
    });
    document.getElementById("btnFinMenu").addEventListener("click", function() {
        closeModal(modalFin);
        stopTimer();
        showScreen(menuScreen);
    });
    
    document.getElementById("btnPauseGame").addEventListener("click", togglePause);
    document.getElementById("btnAbandonGame").addEventListener("click", abandonGame);
    document.getElementById("btnClearHistory").addEventListener("click", clearHistory);
    
    var modePvP = document.getElementById("modePvP");
    var modePvA = document.getElementById("modePvA");
    var iaOptions = document.getElementById("iaOptions");
    var nameNordGroup = document.getElementById("nameNordGroup");
    
    modePvP.addEventListener("click", function() {
        modePvP.classList.add("selected");
        modePvA.classList.remove("selected");
        iaOptions.classList.add("hidden");
        nameNordGroup.style.display = "block";
        gameMode = "pvp";
    });
    modePvA.addEventListener("click", function() {
        modePvA.classList.add("selected");
        modePvP.classList.remove("selected");
        iaOptions.classList.remove("hidden");
        nameNordGroup.style.display = "none";
        gameMode = "pva";
    });
    
    var levelBtns = document.querySelectorAll(".level-btn");
    for(var i = 0; i < levelBtns.length; i++) {
        levelBtns[i].addEventListener("click", function() {
            var btns = document.querySelectorAll(".level-btn");
            for(var j = 0; j < btns.length; j++) btns[j].classList.remove("selected");
            this.classList.add("selected");
            aiLevel = this.getAttribute("data-level");
            if(typeof songoAI !== "undefined") songoAI.setLevel(aiLevel);
        });
    }
    
    document.getElementById("closeAide").addEventListener("click", function() { closeModal(modalAide); });
    
    var aideTabs = document.querySelectorAll(".aide-tab");
    for(var k = 0; k < aideTabs.length; k++) {
        aideTabs[k].addEventListener("click", function() {
            var tabs = document.querySelectorAll(".aide-tab");
            for(var t = 0; t < tabs.length; t++) tabs[t].classList.remove("active");
            this.classList.add("active");
            loadAideContent(this.getAttribute("data-tab"));
        });
    }
    
    var savedTheme = localStorage.getItem("songo_theme");
    applyTheme(savedTheme === "modern" ? "modern" : "wood");
    
    renderScoresList();
    loadAideContent("regles");
});

function showScreen(screen) {
    var screens = document.querySelectorAll(".screen");
    for(var i = 0; i < screens.length; i++) screens[i].classList.remove("active");
    screen.classList.add("active");
}

function openModal(modal) {
    modal.classList.add("open");
}

function closeModal(modal) {
    modal.classList.remove("open");
}

function showToast(message, duration) {
    if(!duration) duration = 2500;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function() {
        toast.classList.remove("show");
    }, duration);
}

function toggleTheme() {
    var current = document.body.getAttribute("data-theme");
    var newTheme = current === "wood" ? "modern" : "wood";
    applyTheme(newTheme);
    localStorage.setItem("songo_theme", newTheme);
}

function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
}

function loadAideContent(tab) {
    var container = document.getElementById("aideContent");
    var contents = {
        regles: '<h3>Regles du Songo</h3><p>Le Songo est un jeu de semailles traditionnel des Ekang (Cameroun, Gabon). Chaque joueur possede 7 cases avec 5 graines au depart.</p><ul><li><strong>Distribution :</strong> On prend toutes les graines d\'une case de son territoire et on les seme une a une de droite a gauche (son camp) puis gauche a droite (camp adverse).</li><li><strong>Capture :</strong> Si la derniere graine tombe dans une case adverse contenant 1 a 3 graines (avant ajout), on capture cette case et les precedentes qui contiennent 2 a 4 graines.</li><li><strong>Solidarite :</strong> Si le camp adverse est vide, on doit lui donner au moins 7 graines.</li><li><strong>Interdits :</strong> Ne pas semer 1 ou 2 graines depuis sa case 7. Ne pas vider totalement le camp adverse.</li><li><strong>Fin :</strong> 40 graines gagnees, moins de 10 graines restantes, ou solidarite impossible.</li></ul>',
        tuto: '<h3>Tutoriel rapide</h3><p>1. Choisissez votre mode (2 joueurs ou vs IA).</p><p>2. Cliquez sur une case de votre territoire (les cases jouables sont bordees en vert).</p><p>3. Les graines sont distribuees automatiquement avec animation.</p><p>4. Les captures se font automatiquement si la condition est remplie.</p><p>5. Le jeu s\'arrete quand un joueur atteint 40 graines.</p><p><strong>Conseil :</strong> Anticipez les captures de l\'adversaire !</p>',
        astuces: '<h3>Astuces</h3><ul><li>Controlez la case 7 (extreme droite) — elle peut etre dangereuse.</li><li>Forcez l\'adversaire a semer dans ses cases vides pour creer des captures.</li><li>En mode IA Difficile, l\'ordinateur anticipe vos mouvements.</li><li>Conservez au moins 2 graines par case pour eviter les offrandes faciles.</li></ul>'
    };
    container.innerHTML = contents[tab] || contents.regles;
}

function addHistoryEntry(playerName, capturedSeeds, fromPits) {
    var time = new Date().toLocaleTimeString().slice(0,5);
    var pitsText = Array.isArray(fromPits) ? fromPits.map(function(p) { return p + 1; }).join(", ") : fromPits;
    captureHistory.unshift({
        time: time,
        player: playerName,
        seeds: capturedSeeds,
        pits: pitsText
    });
    
    if(captureHistory.length > 20) captureHistory.pop();
    renderHistory();
}

function renderHistory() {
    var historyList = document.getElementById("historyList");
    if(!historyList) return;
    
    if(captureHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">Aucune capture pour l instant</div>';
        return;
    }
    
    var html = "";
    for(var i = 0; i < captureHistory.length; i++) {
        var entry = captureHistory[i];
        html += '<div class="history-entry"><span class="player">' + entry.player + '</span><span>capture ' + entry.seeds + ' graine(s) depuis case(s) ' + entry.pits + '</span><span class="time">' + entry.time + '</span></div>';
    }
    historyList.innerHTML = html;
}

function clearHistory() {
    captureHistory = [];
    renderHistory();
    showToast("Historique des captures efface");
}

function togglePause() {
    var pauseBtn = document.getElementById("btnPauseGame");
    if(!gameActive || gameOver) {
        showToast("Partie terminee, impossible de mettre en pause");
        return;
    }
    
    isPaused = !isPaused;
    if(isPaused) {
        stopTimer();
        pauseBtn.textContent = "Reprendre";
        pauseBtn.classList.add("paused");
        showToast("Jeu en pause");
    } else {
        startTimer();
        pauseBtn.textContent = "Pause";
        pauseBtn.classList.remove("paused");
        showToast("Reprise du jeu");
        
        if(gameMode === "pva" && !animationLock && currentPlayer === 0 && gameActive) {
            setTimeout(function() { playAITurn(); }, 300);
        }
    }
}

function abandonGame() {
    if(!gameActive || gameOver) {
        showToast("Partie deja terminee");
        return;
    }
    
    var abandonPlayer = currentPlayer;
    var winner = abandonPlayer === 0 ? "SUD" : "NORD";
    var winnerName = winner === "NORD" ? nordName : sudName;
    var loserName = abandonPlayer === 0 ? nordName : sudName;
    
    gameActive = false;
    gameOver = true;
    stopTimer();
    
    if(abandonPlayer === 0) scores[1] = WIN_SCORE;
    else scores[0] = WIN_SCORE;
    
    try {
        var entry = new ScoreEntry(
            new Date().toISOString(),
            winner,
            scores[0],
            scores[1],
            gameMode,
            currentDuration,
            nordName,
            sudName
        );
        saveScore(entry);
        renderScoresList();
    } catch(e) {}
    
    showToast(loserName + " a abandonne. Victoire de " + winnerName);
    
    var finTitre = document.getElementById("finTitre");
    var finMessage = document.getElementById("finMessage");
    var finStats = document.getElementById("finStats");
    
    if(finTitre) finTitre.textContent = "Victoire par abandon";
    if(finMessage) finMessage.textContent = winnerName + " gagne car " + loserName + " a abandonne";
    if(finStats) {
        var mins = Math.floor(currentDuration / 60);
        var secs = currentDuration % 60;
        var durationStr = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
        finStats.innerHTML = "<div>" + nordName + " : " + scores[0] + " graines</div><div>" + sudName + " : " + scores[1] + " graines</div><div>Temps : " + durationStr + "</div>";
    }
    
    if(modalFin) openModal(modalFin);
}

function initGame() {
    gameBoard = [];
    for(var i = 0; i < 14; i++) {
        gameBoard[i] = INIT_SEEDS;
    }
    scores = [0, 0];
    currentPlayer = 0;
    gameActive = true;
    gameOver = false;
    animationLock = false;
    isPaused = false;
    currentDuration = 0;
    captureHistory = [];
    renderHistory();
    
    var pauseBtn = document.getElementById("btnPauseGame");
    if(pauseBtn) {
        pauseBtn.textContent = "Pause";
        pauseBtn.classList.remove("paused");
    }
    
    updateUI();
    highlightCurrentPlayer();
    startTimer();
}

function startGameFromMenu() {
    nordName = document.getElementById("nameNord").value.trim() || "NORD";
    sudName = document.getElementById("nameSud").value.trim() || "SUD";
    
    var modePvAIsSelected = document.getElementById("modePvA").classList.contains("selected");
    if(modePvAIsSelected) {
        gameMode = "pva";
        nordName = "IA";
        document.getElementById("displayNameNord").textContent = "IA";
        document.getElementById("displayNameSud").textContent = sudName;
    } else {
        gameMode = "pvp";
        document.getElementById("displayNameNord").textContent = nordName;
        document.getElementById("displayNameSud").textContent = sudName;
    }
    
    initGame();
    showScreen(document.getElementById("screenGame"));
}

function restartGame() {
    if(timerInterval) clearInterval(timerInterval);
    initGame();
    if(gameMode === "pva" && currentPlayer === 0 && gameActive && !isPaused) {
        setTimeout(function() { playAITurn(); }, 500);
    }
}

function startTimer() {
    if(timerInterval) clearInterval(timerInterval);
    if(isPaused) return;
    gameStartTime = Date.now() - (currentDuration * 1000);
    timerInterval = setInterval(function() {
        if(gameActive && !gameOver && !isPaused) {
            currentDuration = Math.floor((Date.now() - gameStartTime) / 1000);
            if(chronoDisplay) {
                var mins = Math.floor(currentDuration / 60);
                var secs = currentDuration % 60;
                chronoDisplay.textContent = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
            }
        }
    }, 1000);
}

function stopTimer() {
    if(timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateUI() {
    if(grainNordSpan) grainNordSpan.textContent = scores[0];
    if(grainSudSpan) grainSudSpan.textContent = scores[1];
    renderBoard();
    checkGameEnd();
}

function renderBoard() {
    if(!rangeeNord || !rangeeSud) return;
    
    rangeeNord.innerHTML = "";
    for(var i = 0; i < 7; i++) {
        var caseDiv = createCaseElement(i, gameBoard[i], 0, i+1);
        rangeeNord.appendChild(caseDiv);
    }
    
    rangeeSud.innerHTML = "";
    for(var j = 7; j < 14; j++) {
        var caseDiv2 = createCaseElement(j, gameBoard[j], 1, j-6);
        rangeeSud.appendChild(caseDiv2);
    }
}

function createCaseElement(index, seeds, owner, caseNumber) {
    var div = document.createElement("div");
    div.className = "case";
    div.setAttribute("data-index", index);
    
    var isPlayable = gameActive && !gameOver && !animationLock && !isPaused && currentPlayer === owner && seeds > 0;
    if(isPlayable) {
        div.classList.add("jouable");
        div.addEventListener("click", function(e) {
            e.stopPropagation();
            handleMove(index);
        });
    }
    
    var numSpan = document.createElement("span");
    numSpan.className = "case-numero";
    numSpan.textContent = caseNumber;
    
    var countSpan = document.createElement("span");
    countSpan.className = "case-count";
    countSpan.textContent = seeds;
    
    var grainsDiv = document.createElement("div");
    grainsDiv.className = "case-grains";
    var grainCount = seeds < 15 ? seeds : 15;
    for(var g = 0; g < grainCount; g++) {
        var grain = document.createElement("div");
        grain.className = "grain";
        grainsDiv.appendChild(grain);
    }
    
    div.appendChild(numSpan);
    div.appendChild(countSpan);
    div.appendChild(grainsDiv);
    
    return div;
}

async function handleMove(pitIndex) {
    if(!gameActive || gameOver || animationLock || isPaused) return;
    if(gameBoard[pitIndex] === 0) {
        showToast("Case vide !");
        return;
    }
    
    var oppositePlayer = 1 - currentPlayer;
    if(isCampEmpty(oppositePlayer)) {
        var seedsInOpponent = countSeedsSownInOpponent(pitIndex);
        if(seedsInOpponent < 7) {
            showToast("Solidarite : vous devez donner au moins 7 graines a l'adversaire !");
            return;
        }
    }
    
    var isForbiddenPit = (currentPlayer === 0 && pitIndex === 6 && gameBoard[pitIndex] <= 2) ||
                           (currentPlayer === 1 && pitIndex === 13 && gameBoard[pitIndex] <= 2);
    
    if(isForbiddenPit) {
        var penaltySeeds = gameBoard[pitIndex];
        gameBoard[pitIndex] = 0;
        scores[1 - currentPlayer] += penaltySeeds;
        showToast("Interdit case 7 : graines perdues !");
        updateUI();
        changeTurn();
        return;
    }
    
    if(wouldEmptyOpponentCamp(pitIndex)) {
        showToast("Interdit : vous ne pouvez pas vider completement le camp adverse !");
        return;
    }
    
    await executeMoveWithAnimation(pitIndex);
}

function countSeedsSownInOpponent(pitIndex) {
    var seeds = gameBoard[pitIndex];
    if(seeds === 0) return 0;
    
    var pos = pitIndex;
    var remaining = seeds;
    var oppSeeds = 0;
    
    while(remaining > 0) {
        pos = (pos + 1) % 14;
        if(currentPlayer === 0 && pos >= 7) oppSeeds++;
        if(currentPlayer === 1 && pos < 7) oppSeeds++;
        remaining--;
    }
    return oppSeeds;
}

function wouldEmptyOpponentCamp(pitIndex) {
    var boardCopy = gameBoard.slice();
    var seeds = boardCopy[pitIndex];
    if(seeds === 0) return false;
    
    boardCopy[pitIndex] = 0;
    var pos = pitIndex;
    var remaining = seeds;
    
    while(remaining > 0) {
        pos = (pos + 1) % 14;
        boardCopy[pos]++;
        remaining--;
    }
    
    var oppStart = currentPlayer === 0 ? 7 : 0;
    for(var i = oppStart; i < oppStart + 7; i++) {
        if(boardCopy[i] > 0) return false;
    }
    return true;
}

async function executeMoveWithAnimation(pitIndex) {
    animationLock = true;
    
    var seeds = gameBoard[pitIndex];
    if(seeds === 0) {
        animationLock = false;
        return;
    }
    
    gameBoard[pitIndex] = 0;
    updateUI();
    await sleep(100);
    
    var pos = pitIndex;
    var remaining = seeds;
    var animationSteps = [];
    
    while(remaining > 0) {
        pos = (pos + 1) % 14;
        animationSteps.push(pos);
        remaining--;
    }
    
    for(var stepIdx = 0; stepIdx < animationSteps.length; stepIdx++) {
        var step = animationSteps[stepIdx];
        gameBoard[step]++;
        updateUI();
        
        var caseElement = document.querySelector('.case[data-index="' + step + '"]');
        if(caseElement) {
            caseElement.classList.add("animating");
            setTimeout(function(el) {
                if(el) el.classList.remove("animating");
            }, 200, caseElement);
        }
        await sleep(70);
    }
    
    var lastPit = animationSteps[animationSteps.length - 1];
    var capturedPits = [];
    
    if(currentPlayer === 0 && lastPit >= 7 && lastPit <= 13 && lastPit !== 7) {
        var val = gameBoard[lastPit];
        if(val >= 2 && val <= 4) {
            capturedPits.push(lastPit);
            var prev = lastPit - 1;
            while(prev >= 7 && gameBoard[prev] >= 2 && gameBoard[prev] <= 4) {
                capturedPits.push(prev);
                prev--;
            }
        }
    } else if(currentPlayer === 1 && lastPit >= 0 && lastPit <= 6 && lastPit !== 6) {
        var val2 = gameBoard[lastPit];
        if(val2 >= 2 && val2 <= 4) {
            capturedPits.push(lastPit);
            var prev2 = lastPit - 1;
            while(prev2 >= 0 && gameBoard[prev2] >= 2 && gameBoard[prev2] <= 4) {
                capturedPits.push(prev2);
                prev2--;
            }
        }
    }
    
var totalCaptured = 0;
    for(var c = 0; c < capturedPits.length; c++) {
        var cp = capturedPits[c];
        totalCaptured += gameBoard[cp];
        gameBoard[cp] = 0;
        
        var capturedElement = document.querySelector('.case[data-index="' + cp + '"]');
        if(capturedElement) {
            capturedElement.style.transition = "background 0.2s";
            capturedElement.style.background = "var(--capture-color)";
            setTimeout(function(el) {
                if(el) el.style.background = "";
            }, 300, capturedElement);
        }
    }
    
    if(totalCaptured > 0) {
        scores[currentPlayer] += totalCaptured;
        var playerName = currentPlayer === 0 ? nordName : sudName;
        var pitNumbers = capturedPits.map(function(p) { return (p % 7) + 1; });
        addHistoryEntry(playerName, totalCaptured, pitNumbers);
        showToast(playerName + " capture " + totalCaptured + " graine(s) !");
        updateUI();
        await sleep(400);
    }
    
    if(isCampEmpty(1 - currentPlayer)) {
        showToast("Interdit : vous ne pouvez pas vider le camp adverse !");
        gameActive = false;
        gameOver = true;
        animationLock = false;
        endGame("nul", "Partie annulee - Camp adverse vide", scores[0], scores[1]);
        return;
    }
    
    animationLock = false;
    changeTurn();
    updateUI();
}

function changeTurn() {
    currentPlayer = 1 - currentPlayer;
    highlightCurrentPlayer();
    
    if(gameMode === "pva" && gameActive && !gameOver && !animationLock && !isPaused && currentPlayer === 0) {
        setTimeout(function() { playAITurn(); }, 400);
    }
}

function playAITurn() {
    if(!gameActive || gameOver || animationLock || isPaused) return;
    if(currentPlayer !== 0) return;
    
    var availableMoves = [];
    for(var i = 0; i < 7; i++) {
        if(gameBoard[i] > 0) availableMoves.push(i);
    }
    if(availableMoves.length === 0) {
        changeTurn();
        return;
    }
    
    var move = null;
    if(typeof songoAI !== "undefined" && songoAI) {
        move = songoAI.chooseMove(gameBoard.slice(), 0, {
            simulateMove: function(m, p) { return simulateMoveForAI(m, p); },
            simulateMoveOnBoard: function(m, p, b) { return simulateMoveOnBoardForAI(m, p, b); }
        });
    }
    
    if(move === null || move === undefined) {
        var randomIdx = Math.floor(Math.random() * availableMoves.length);
        move = availableMoves[randomIdx];
    }
    
    if(move !== null && gameBoard[move] > 0) {
        setTimeout(function() { executeMoveWithAnimation(move); }, 300);
    }
}

function simulateMoveForAI(move, player) {
    return simulateMoveOnBoardForAI(move, player, gameBoard.slice());
}

function simulateMoveOnBoardForAI(move, player, board) {
    var boardCopy = board.slice();
    var seeds = boardCopy[move];
    if(seeds === 0) return { capturedSeeds: 0, chainLength: 0, seedsGivenToOpponent: 0, selfRemainingSeeds: 0 };
    
    boardCopy[move] = 0;
    var pos = move;
    var remaining = seeds;
    
    while(remaining > 0) {
        pos = (pos + 1) % 14;
        boardCopy[pos]++;
        remaining--;
    }
    
    var lastPit = pos;
    var capturedSeeds = 0;
    var chainLength = 0;
    
    if(player === 0 && lastPit >= 7 && lastPit <= 13 && lastPit !== 7) {
        var val = boardCopy[lastPit];
        if(val >= 2 && val <= 4) {
            capturedSeeds += val;
            chainLength++;
            var prev = lastPit - 1;
            while(prev >= 7 && boardCopy[prev] >= 2 && boardCopy[prev] <= 4) {
                capturedSeeds += boardCopy[prev];
                chainLength++;
                prev--;
            }
        }
    } else if(player === 1 && lastPit >= 0 && lastPit <= 6 && lastPit !== 6) {
        var val2 = boardCopy[lastPit];
        if(val2 >= 2 && val2 <= 4) {
            capturedSeeds += val2;
            chainLength++;
            var prev2 = lastPit - 1;
            while(prev2 >= 0 && boardCopy[prev2] >= 2 && boardCopy[prev2] <= 4) {
                capturedSeeds += boardCopy[prev2];
                chainLength++;
                prev2--;
            }
        }
    }
    
    var oppStart = player === 0 ? 7 : 0;
    var seedsGivenToOpponent = 0;
    for(var i = oppStart; i < oppStart + 7; i++) {
        seedsGivenToOpponent += boardCopy[i];
    }
    
    var selfStart = player === 0 ? 0 : 7;
    var selfRemainingSeeds = 0;
    for(var j = selfStart; j < selfStart + 7; j++) {
        selfRemainingSeeds += boardCopy[j];
    }
    
    return { 
        capturedSeeds: capturedSeeds, 
        chainLength: chainLength, 
        seedsGivenToOpponent: seedsGivenToOpponent, 
        selfRemainingSeeds: selfRemainingSeeds,
        nextBoard: boardCopy,
        nextPlayer: 1 - player
    };
}

function isCampEmpty(player) {
    var start = player === 0 ? 0 : 7;
    for(var i = start; i < start + 7; i++) {
        if(gameBoard[i] > 0) return false;
    }
    return true;
}

function highlightCurrentPlayer() {
    var nordCard = document.getElementById("scoreCardNord");
    var sudCard = document.getElementById("scoreCardSud");
    if(nordCard) nordCard.classList.remove("active-turn");
    if(sudCard) sudCard.classList.remove("active-turn");
    
    if(currentPlayer === 0 && nordCard) {
        nordCard.classList.add("active-turn");
        if(tourNomSpan) tourNomSpan.textContent = nordName;
    } else if(sudCard) {
        sudCard.classList.add("active-turn");
        if(tourNomSpan) tourNomSpan.textContent = sudName;
    }
}

function checkGameEnd() {
    if(!gameActive || gameOver) return;
    
    if(scores[0] >= WIN_SCORE) {
        gameActive = false;
        gameOver = true;
        stopTimer();
        endGame("NORD", nordName + " atteint " + WIN_SCORE + " graines !", scores[0], scores[1]);
        return;
    }
    if(scores[1] >= WIN_SCORE) {
        gameActive = false;
        gameOver = true;
        stopTimer();
        endGame("SUD", sudName + " atteint " + WIN_SCORE + " graines !", scores[0], scores[1]);
        return;
    }
    
    var totalRemaining = 0;
    for(var i = 0; i < 14; i++) totalRemaining += gameBoard[i];
    
    if(totalRemaining < 10) {
        var nordRemaining = 0;
        var sudRemaining = 0;
        for(var n = 0; n < 7; n++) nordRemaining += gameBoard[n];
        for(var s = 7; s < 14; s++) sudRemaining += gameBoard[s];
        
        scores[0] += nordRemaining;
        scores[1] += sudRemaining;
        for(var cl = 0; cl < 14; cl++) gameBoard[cl] = 0;
        updateUI();
        gameActive = false;
        gameOver = true;
        stopTimer();
        
        if(scores[0] > scores[1]) endGame("NORD", "Moins de 10 graines restantes", scores[0], scores[1]);
        else if(scores[1] > scores[0]) endGame("SUD", "Moins de 10 graines restantes", scores[0], scores[1]);
        else endGame("nul", "Partie nulle - moins de 10 graines", scores[0], scores[1]);
        return;
    }
    
    if(isCampEmpty(currentPlayer)) {
        var hasMove = false;
        var start = currentPlayer === 0 ? 0 : 7;
        for(var m = start; m < start + 7; m++) {
            if(gameBoard[m] > 0) hasMove = true;
        }
        if(!hasMove) {
            gameActive = false;
            gameOver = true;
            stopTimer();
            var winner = currentPlayer === 0 ? "SUD" : "NORD";
            var winnerName = winner === "NORD" ? nordName : sudName;
            endGame(winner, winnerName + " gagne par solidarite", scores[0], scores[1]);
        }
    }
}

function endGame(winner, message, scoreNord, scoreSud) {
    if(!gameActive && gameOver) return;
    
    gameActive = false;
    gameOver = true;
    stopTimer();
    
    var winnerName = "";
    if(winner === "NORD") winnerName = nordName;
    else if(winner === "SUD") winnerName = sudName;
    else winnerName = "Match nul";
    
    if(typeof saveScore !== "undefined") {
        try {
            var entry = new ScoreEntry(
                new Date().toISOString(),
                winner,
                scores[0],
                scores[1],
                gameMode,
                currentDuration,
                nordName,
                sudName
            );
            saveScore(entry);
            if(typeof renderScoresList !== "undefined") renderScoresList();
        } catch(e) {}
    }
    
    var finTitre = document.getElementById("finTitre");
    var finMessage = document.getElementById("finMessage");
    var finStats = document.getElementById("finStats");
    
    if(finTitre) {
        if(winner === "NORD") finTitre.textContent = "Victoire de " + nordName + " !";
        else if(winner === "SUD") finTitre.textContent = "Victoire de " + sudName + " !";
        else finTitre.textContent = "Match nul";
    }
    if(finMessage) finMessage.textContent = message;
    if(finStats) {
        var mins = Math.floor(currentDuration / 60);
        var secs = currentDuration % 60;
        var durationStr = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
        finStats.innerHTML = "<div>" + nordName + " : " + scores[0] + " graines</div><div>" + sudName + " : " + scores[1] + " graines</div><div>Temps : " + durationStr + "</div>";
    }
    
    if(modalFin) openModal(modalFin);
}

function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}
