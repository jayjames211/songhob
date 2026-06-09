var STORAGE_KEY = "songo_scores";

function ScoreEntry(date, winner, scoreNord, scoreSud, mode, duration, nordName, sudName) {
    this.id = Date.now() + Math.random();
    this.date = date || new Date().toISOString();
    this.winner = winner;
    this.scoreNord = scoreNord;
    this.scoreSud = scoreSud;
    this.mode = mode;
    this.duration = duration;
    this.nordName = nordName || "NORD";
    this.sudName = sudName || "SUD";
}

function getScores() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch(e) {
        return [];
    }
}

function saveScore(entry) {
    var scores = getScores();
    scores.unshift(entry);
    while(scores.length > 50) scores.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    return scores;
}

function clearScores() {
    localStorage.removeItem(STORAGE_KEY);
    return [];
}

function exportScoresToJSON() {
    var scores = getScores();
    var dataStr = JSON.stringify(scores, null, 2);
    var blob = new Blob([dataStr], {type: "application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "songo_scores_" + new Date().toISOString().slice(0,19) + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

function getStats() {
    var scores = getScores();
    if(scores.length === 0) {
        return {
            totalParties: 0,
            victoiresNord: 0,
            victoiresSud: 0,
            nulles: 0,
            avgScoreNord: 0,
            avgScoreSud: 0
        };
    }
    
    var victoiresNord = 0, victoiresSud = 0, nulles = 0;
    var totalScoreNord = 0, totalScoreSud = 0;
    
    for(var i = 0; i < scores.length; i++) {
        var entry = scores[i];
        if(entry.winner === "NORD") victoiresNord++;
        else if(entry.winner === "SUD") victoiresSud++;
        else nulles++;
        totalScoreNord += entry.scoreNord;
        totalScoreSud += entry.scoreSud;
    }
    
    return {
        totalParties: scores.length,
        victoiresNord: victoiresNord,
        victoiresSud: victoiresSud,
        nulles: nulles,
        avgScoreNord: Math.round(totalScoreNord / scores.length),
        avgScoreSud: Math.round(totalScoreSud / scores.length)
    };
}

function getAdversaryStats() {
    var scores = getScores();
    var adversaryMap = {};
    
    for(var i = 0; i < scores.length; i++) {
        var entry = scores[i];
        var advName = "";
        var myName = "";
        var iWon = false;
        
        if(entry.mode === "pvp") {
            if(entry.nordName === "Joueur" || entry.sudName === "Joueur") {
                if(entry.nordName === "Joueur") {
                    myName = "Joueur";
                    advName = entry.sudName;
                    iWon = (entry.winner === "NORD");
                } else {
                    myName = "Joueur";
                    advName = entry.nordName;
                    iWon = (entry.winner === "SUD");
                }
            } else {
                advName = entry.nordName + " / " + entry.sudName;
                iWon = false;
            }
        } else {
            advName = "IA";
            myName = "Joueur";
            iWon = (entry.winner === "SUD");
        }
        
        if(!adversaryMap[advName]) {
            adversaryMap[advName] = { wins: 0, losses: 0, draws: 0, total: 0 };
        }
        
        if(iWon) adversaryMap[advName].wins++;
        else if(entry.winner === "nul") adversaryMap[advName].draws++;
        else adversaryMap[advName].losses++;
        adversaryMap[advName].total++;
    }
    
    return adversaryMap;
}

function renderScoresList() {
    var container = document.getElementById("scoresList");
    var statsContainer = document.getElementById("scoresStats");
    var adversaryContainer = document.getElementById("adversaryList");
    
    if(!container) return;
    
    var scores = getScores();
    var stats = getStats();
    var adversaryStats = getAdversaryStats();
    
    if(statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item"><span>${stats.totalParties}</span><span>Parties</span></div>
            <div class="stat-item"><span>${stats.victoiresNord}</span><span>Nord</span></div>
            <div class="stat-item"><span>${stats.victoiresSud}</span><span>Sud</span></div>
            <div class="stat-item"><span>${stats.nulles}</span><span>Nulles</span></div>
            <div class="stat-item"><span>${stats.avgScoreNord}</span><span>Moy. Nord</span></div>
            <div class="stat-item"><span>${stats.avgScoreSud}</span><span>Moy. Sud</span></div>
        `;
    }
    
    if(adversaryContainer) {
        var advHtml = "";
        for(var adv in adversaryStats) {
            var data = adversaryStats[adv];
            advHtml += `
                <div class="adversary-item">
                    <span class="adversary-name">${adv}</span>
                    <span>Victoires: ${data.wins} | Defaites: ${data.losses} | Nuls: ${data.draws}</span>
                </div>
            `;
        }
        if(advHtml === "") advHtml = "<div class='history-empty'>Aucune statistique disponible</div>";
        adversaryContainer.innerHTML = advHtml;
    }
    
    if(scores.length === 0) {
        container.innerHTML = '<div class="score-entry">Aucune partie enregistree</div>';
        return;
    }
    
    var scoresHtml = "";
    for(var i = 0; i < scores.length; i++) {
        var entry = scores[i];
        var dateStr = new Date(entry.date).toLocaleDateString() + " " + new Date(entry.date).toLocaleTimeString().slice(0,5);
        var winnerText = "";
        if(entry.winner === "NORD") winnerText = entry.nordName + " gagne";
        else if(entry.winner === "SUD") winnerText = entry.sudName + " gagne";
        else winnerText = "Partie nulle";
        
        var mins = Math.floor(entry.duration / 60);
        var secs = entry.duration % 60;
        var durationStr = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
        
        scoresHtml += `
            <div class="score-entry">
                <div>
                    <div class="winner">${winnerText}</div>
                    <div class="details">${dateStr} - ${durationStr} - ${entry.mode === "pvp" ? "2J" : "VS IA"}</div>
                </div>
                <div class="details">
                    ${entry.nordName} ${entry.scoreNord} - ${entry.scoreSud} ${entry.sudName}
                </div>
            </div>
        `;
    }
    container.innerHTML = scoresHtml;
}
