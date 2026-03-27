// ==========================================
// GLOBAL VARIABLES (Shared Scope)
// ==========================================

// --- USER CONFIGURATION ---
// IMPORTANT: Change this number for each Question in Qualtrics (1, 2, ... 12)
var currentTaskIndex = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('CurrentTaskIndex')); 
var debugMode = false; // Set to false to hide red debug text

// --- CONSTANTS ---
var mainConfigUrl = 'https://mhalfmann.github.io/QualtricsTest/mainConfigDE.json'; // Tasks
var answerKeyUrl = 'https://mhalfmann.github.io/QualtricsTest/answerKeyDE.json';

// --- STATE ---
var allConfigs = {};
var allAnswerKeys = {};
var currentTaskConfig = {};
var currentAnswerKey = null;
var completedTasksList = []; 

// This object will hold the final data to be saved in addOnPageSubmit
var finalTaskData = null; 

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function injectStyles() {
    var css = '' +
        /* Grid Layout */
        '#selection-grid-container { display: grid; grid-template-columns: repeat(15, 1fr); gap: 4px; margin-top: 15px; border: 1px solid #ccc; padding: 5px; background: white; }' +
        '.grid-header, .grid-header-sub { font-weight: bold; text-align: center; padding: 8px; color: black; font-size: 0.9em; }' +
        '.grid-header { grid-column: span 3; color: black; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }' +
        
        /* Headers */
        '.level-1-header { background-color: #d1e3f6 !important; }' + 
        '.level-2-header { background-color: #a2c8ed !important; }' + 
        '.level-3-header { background-color: #73ade4 !important; }' + 
        '.level-4-header { background-color: #4492db !important; }' + 
        '.level-5-header { background-color: #1577d2 !important; }' +
        
        /* Buttons and Sub-Headers */
        '.sub-grad-1 { background-color: #e3f2fd !important; }' +
        '.sub-grad-2 { background-color: #90caf9 !important; }' +
        '.sub-grad-3 { background-color: #42a5f5 !important; }' +
        
        '.grid-cell { display: flex; align-items: stretch; justify-content: stretch; }' +
        '.grid-cell button { width: 100%; min-height: 50px; padding: 5px; border: 1px solid #ccc; cursor: pointer; font-size: 0.85em; color: black; transition: all 0.2s; border-radius: 3px; }' +
        '.grid-cell button:hover { border-color: #000; transform: scale(1.02); z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }' +
        '.grid-cell button:disabled { background-color: #e0e0e0 !important; color: #999 !important; cursor: not-allowed; border-color: #ddd !important; transform: none; box-shadow: none; }' +
        
        /* General UI */
        '.stamboom-container { font-family: sans-serif; padding: 10px 0; } .stamboom-gen { position: relative; display: flex; justify-content: center; margin: 30px 0; } .stamboom-node { border: 2px solid #666; border-radius: 8px; padding: 10px; min-width: 120px; background-color: #f9f9f9; z-index: 2; } .stamboom-node .name { font-weight: bold; } .stamboom-node .genotype-input { font-family: monospace; font-size: 1.2em; text-align: center; width: 50px; border: 1px solid #ccc; margin-top: 5px; } .stamboom-node .genotype-input:disabled { background-color: #e0e0e0; color: #333; font-weight: bold; } .stamboom-connector { display: flex; align-items: center; } .stamboom-gen:not(:last-child)::after { content: ""; position: absolute; left: 50%; top: 100%; width: 2px; height: 30px; background-color: #ccc; z-index: 1; } .stamboom-connector::before, .stamboom-connector::after { content: ""; height: 2px; background-color: #ccc; flex-grow: 1; } .stamboom-connector span { color: #666; font-size: 24px; background: #fff; z-index: 2; padding: 0 5px; margin: 0 15px; }' +
        '.choice-label { display: block; border: 2px solid #ccc; border-radius: 5px; padding: 10px; margin: 5px 0; cursor: pointer; background-color: #f9f9f9; transition: all 0.2s ease; text-align: center; }' +
        '.choice-label:hover { background-color: #e9e9e9; border-color: #999; }' +
        '.choice-label.selected { border-color: #2a7ac2; background-color: #eaf2fa; font-weight: bold; }' +
        '.choice-label input { display: none; }' +
        '.choice-label.disabled { cursor: not-allowed; background-color: #e0e0e0; color: #555; border-color: #ccc; }' +
        '.punnett-square-wrapper { display: inline-block; margin-right: 20px; vertical-align: top; } .punnett-square-wrapper h5{margin-top:0;text-align:center;} .punnett-square-table{border-collapse:collapse;} .punnett-square-table td{width:45px;height:45px;text-align:center;} .punnett-square-table input{width:100%;height:100%;border:1px solid #ccc;text-align:center;font-family:monospace;font-size:1.2em;box-sizing:border-box;} .punnett-square-table input:disabled { background-color: #e0e0e0; color: #333; font-weight: bold; } .punnett-square-table .corner{background-color:#f0f0f0;border:none;}';
    
    var styleElement = document.createElement('style'); 
    styleElement.type = 'text/css'; 
    styleElement.innerHTML = css; 
    document.getElementsByTagName('head')[0].appendChild(styleElement);
}

function showScreen(screenId) {
    var screens = ['level-selection-screen', 'task-screen', 'effort-screen', 'complete-screen'];
    for (var i = 0; i < screens.length; i++) {
        var el = document.getElementById(screens[i]);
        if(el) el.style.display = (screens[i] === screenId) ? 'block' : 'none';
    }
}

function showLevelSelector(clickableColumn) {
    if (clickableColumn === undefined) clickableColumn = 0;
    clickableColumn = Number(clickableColumn);
    var container = document.getElementById('selection-grid-container');
    var helpLevels = { veel_hulp: "Viel Hilfe", enige_hulp: "Etwas Hilfe", alles_zelf: "Alles selbst" };
    var html = '';

    // Headers
    for (var i = 1; i <= 5; i++) { html += '<div class="grid-header level-' + i + '-header">Niveau ' + i + '</div>'; }
    
	// 2. Sub-headers (Hulp)
    for (var i = 1; i <= 5; i++) {
        var shade = 1;
        for (var helpKey in helpLevels) {
            html += '<div class="grid-header-sub sub-grad-' + shade + '">' + helpLevels[helpKey] + '</div>';
            shade++;
        }
    }
    
    // Rows
    var maxTasks = 0;
    for (var i = 1; i <= 5; i++) {
        var lKey = 'level' + i;
        if (allConfigs[lKey]) {
            for (var hKey in helpLevels) {
                if (allConfigs[lKey][hKey]) {
                    var count = Object.keys(allConfigs[lKey][hKey]).length;
                    if (count > maxTasks) maxTasks = count;
                }
            }
        }
    }

    for (var r = 0; r < maxTasks; r++) {
        for (var i = 1; i <= 5; i++) {
            var levelKey = 'level' + i;
            var shade = 1;
            for (var helpKey in helpLevels) {
                var cellContent = '';
                if (allConfigs[levelKey] && allConfigs[levelKey][helpKey]) {
                    var taskKeys = Object.keys(allConfigs[levelKey][helpKey]);
                    if (r < taskKeys.length) {
                        var taskKey = taskKeys[r];
                        var uniqueId = 'L' + i + '_' + helpKey + '_' + taskKey.replace(/\s+/g, '');
                        var isDone = (completedTasksList.indexOf(uniqueId) > -1);
                        var subColIndex = (i - 1) * 3 + shade;
                        var columnDisabled = (clickableColumn !== 0 && subColIndex !== clickableColumn);
                        var disabledAttr = (isDone || columnDisabled) ? 'disabled' : '';

                        cellContent = '<button class="sub-grad-' + shade + '" ' + disabledAttr + ' ' +
                                      'data-level="' + i + '" data-help="' + helpKey + '" data-task="' + taskKey + '" data-uniqueid="' + uniqueId + '" data-subcol="' + subColIndex + '">' + 
                                      taskKey + 
                                      '</button>';
                    }
                }
                html += '<div class="grid-cell">' + cellContent + '</div>';
                shade++;
            }
        }
    }
    
    container.innerHTML = html;
    var buttons = container.getElementsByTagName('button');
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].onclick = function() {
            var level = this.dataset.level; 
            var help = this.dataset.help; 
            var task = this.dataset.task; 
            var uid = this.dataset.uniqueid;
            var subcol = this.dataset.subcol;
            if (typeof Qualtrics !== 'undefined' && Qualtrics.SurveyEngine && Qualtrics.SurveyEngine.setEmbeddedData) {
                Qualtrics.SurveyEngine.setEmbeddedData('CurrentColumn', subcol || '');
            }
            
            currentTaskConfig = allConfigs['level' + level][help][task];
            currentTaskConfig.level = level; 
            currentTaskConfig.help = help; 
            currentTaskConfig.task = task; 
            currentTaskConfig.uniqueId = uid;
            
            // Correctly fetch answer key using help level
            if (allAnswerKeys['level' + level] && allAnswerKeys['level' + level][help] && allAnswerKeys['level' + level][help][task]) {
                currentAnswerKey = allAnswerKeys['level' + level][help][task];
            } else {
                console.warn("Answer key not found for L" + level + ", " + help + ", " + task);
                currentAnswerKey = null;
            }

            // Lock UI
            this.style.borderColor = '#000';
            this.style.transform = 'scale(0.95)';
            for (var k = 0; k < buttons.length; k++) { buttons[k].disabled = true; }
            
            setTimeout(function() { initializeTask(); }, 300);
        };
    }
    showScreen('level-selection-screen');
}

function initializeTask() {
    if (debugMode) {
        var debugDiv = document.getElementById('debug-info');
        debugDiv.innerHTML = 'DEBUG MODE | Task #' + currentTaskIndex + ' | Level: ' + currentTaskConfig.level + ' | Help: ' + currentTaskConfig.help;
        debugDiv.style.display = 'block';
        debugDiv.style.color = 'red';
        debugDiv.style.border = '2px dashed red';
        debugDiv.style.backgroundColor = '#ffe6e6';
    }
    
    var baseDesc = 'Das Merkmal <em>' + currentTaskConfig.gene.trait + '</em> wird durch ein Gen bestimmt (' + currentTaskConfig.gene.dominant.allele + ' = ' + currentTaskConfig.gene.dominant.phenotype + ', ' + currentTaskConfig.gene.recessive.allele + ' = ' + currentTaskConfig.gene.recessive.phenotype + ').<br><br>';
    document.getElementById('task-description').innerHTML = baseDesc + '<strong>Aufgabe:</strong> ' + currentTaskConfig.narrative;
    
    renderStep1(); renderStep2(); renderStep3(); renderStep5();
    
    var isVeelHulp = (currentTaskConfig.help === 'veel_hulp');
    
    document.getElementById('step4-container').style.display = isVeelHulp ? 'block' : 'none';
    document.getElementById('step5-container').style.display = isVeelHulp ? 'block' : 'none';
    document.getElementById('complete-task-btn').style.display = isVeelHulp ? 'block' : 'none';

    showScreen('task-screen');
    document.getElementById('complete-task-btn').onclick = completeTask;
}

// --- RENDER STEPS ---

function renderStep1() {
    var isDisabled = (currentTaskConfig.help === 'enige_hulp' || currentTaskConfig.help === 'veel_hulp');
    var html = '<p>Bestimmen Sie anhand der Beschreibung den Genotyp für jedes bekannte Individuum.</p>';
    for (var key in currentTaskConfig.family) {
        if (currentTaskConfig.family.hasOwnProperty(key) && currentTaskConfig.unknowns.indexOf(key) === -1) {
            var person = currentTaskConfig.family[key];
            var val = (isDisabled && currentAnswerKey) ? currentAnswerKey.step1[person.id] : "";
            html += '<div style="margin: 5px 0;"><label for="' + person.id + '_input" style="width:120px;display:inline-block;">' + person.name + ':</label><input type="text" id="' + person.id + '_input" data-person-id="' + person.id + '" value="' + (val||"") + '" maxlength="2" style="width:50px;text-align:center;font-family:monospace;font-size:1.1em;" ' + (isDisabled ? 'disabled' : '') + '/></div>';
        }
    }
    document.getElementById('step1-inputs').innerHTML = html;
}

function renderStep2() {
    var isDisabled = (currentTaskConfig.help === 'enige_hulp' || currentTaskConfig.help === 'veel_hulp');
    var createNode = function(personId) {
        var person = currentTaskConfig.family[personId];
        var isUnknown = currentTaskConfig.unknowns.indexOf(personId) > -1;
        var placeholder = isUnknown ? '??' : '';
        var val = "";
        if (isDisabled && !isUnknown && currentAnswerKey) { val = currentAnswerKey.step2[personId]; }
        var finalDisabled = isUnknown || isDisabled; 
        return '<div class="stamboom-node"><div class="name">' + person.name + '</div><input type="text" class="genotype-input" id="' + person.id + '_tree_input" data-person-id="' + person.id + '" value="' + (val||"") + '" placeholder="' + placeholder + '" maxlength="2" ' + (finalDisabled ? 'disabled' : '') + '/></div>';
    };
    var gens = { p: [], f1: [], f2: [] };
    for (var key in currentTaskConfig.family) {
        if (key.indexOf('p_') === 0) gens.p.push(key); else if (key.indexOf('f1_') === 0) gens.f1.push(key); else if (key.indexOf('f2_') === 0) gens.f2.push(key);
    }
    var html = '';
    if (gens.p.length > 0) html += '<div class="stamboom-gen">' + createNode(gens.p[0]) + (gens.p[1] ? '<div class="stamboom-connector"><span>&times;</span></div>' + createNode(gens.p[1]) : '') + '</div>';
    if (gens.f1.length > 0) html += '<div class="stamboom-gen">' + createNode(gens.f1[0]) + (gens.f1[1] ? '<div class="stamboom-connector"><span>&times;</span></div>' + createNode(gens.f1[1]) : '') + '</div>';
    if (gens.f2.length > 0) html += '<div class="stamboom-gen">' + createNode(gens.f2[0]) + '</div>';
    document.getElementById('step2-tree').innerHTML = html;
}

function renderStep3() {
    var isVeelHulp = (currentTaskConfig.help === 'veel_hulp');
    var container = document.getElementById('step3-inputs');
    var buttonHtml = '<button type="button" id="generate-tables-btn" style="margin-left: 10px;" ' + (isVeelHulp ? 'disabled style="display:none;"' : '') + '>Tabellen generieren</button>';
    var valCount = (isVeelHulp && currentAnswerKey) ? currentAnswerKey.step3.punnett_squares : "";
    var correctReasoning = (currentAnswerKey) ? currentAnswerKey.step3.reasoning : [];
    
    container.innerHTML = '<p>Bestimmen Sie die Schlussfolgerungsrichtung(en) und die Anzahl der benötigten Kreuztabellen.</p>' +
                          '<div style="margin-bottom: 10px;"><strong>Richtung:</strong>' +
                          '<label class="choice-label ' + (isVeelHulp ? 'disabled' : '') + '"><input type="checkbox" name="reasoning" value="deductief" ' + (isVeelHulp ? 'disabled' : '') + '><span>Deduktiv</span></label>' +
                          '<label class="choice-label ' + (isVeelHulp ? 'disabled' : '') + '"><input type="checkbox" name="reasoning" value="inductief" ' + (isVeelHulp ? 'disabled' : '') + '><span>Induktiv</span></label></div>' +
                          '<div><strong>Anzahl der Kreuztabellen:</strong> <input type="number" id="punnett-squares-needed" value="'+(valCount||"")+'" min="0" max="10" style="width:50px;" ' + (isVeelHulp ? 'disabled' : '') + '> ' + buttonHtml + '</div>';
    
    if (isVeelHulp && currentAnswerKey) {
        var checkboxes = container.querySelectorAll('input[name="reasoning"]');
        for (var i = 0; i < checkboxes.length; i++) {
            if (correctReasoning.indexOf(checkboxes[i].value) > -1) {
                checkboxes[i].checked = true; checkboxes[i].parentElement.classList.add('selected');
            }
        }
    } else {
        var labels = container.getElementsByClassName('choice-label');
        for(var j=0; j<labels.length; j++){ labels[j].onclick = function(e){ e.preventDefault(); var i=this.querySelector('input'); i.checked=!i.checked; this.classList.toggle('selected'); } }
    }

    var generateTables = function() {
        var numTables = currentTaskConfig.punnett_squares_needed;
        var pContainer = document.getElementById('step4-punnett-squares');
        pContainer.innerHTML = numTables > 0 ? '<p>Füllen Sie die Allele und die möglichen Genotypen ein.</p>' : '';
        var answerTables = (isVeelHulp && currentAnswerKey) ? currentAnswerKey.step4 : [];
        for (var k = 0; k < numTables; k++) {
            var tVal = (answerTables[k]) ? answerTables[k] : {};
            var getVal = function(key) { return (isVeelHulp && tVal[key]) ? tVal[key] : ""; };
            pContainer.innerHTML += '<div class="punnett-square-wrapper"><h5>Kreuztabelle '+(k+1)+'</h5><table class="punnett-square-table"><tr><td class="corner"></td><td><input type="text" maxlength="1" data-pos="p2a1" value="'+getVal('p2a1')+'" '+(isVeelHulp?'disabled':'')+'/></td><td><input type="text" maxlength="1" data-pos="p2a2" value="'+getVal('p2a2')+'" '+(isVeelHulp?'disabled':'')+'/></td></tr><tr><td><input type="text" maxlength="1" data-pos="p1a1" value="'+getVal('p1a1')+'" '+(isVeelHulp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o1" value="'+getVal('o1')+'" '+(isVeelHulp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o2" value="'+getVal('o2')+'" '+(isVeelHulp?'disabled':'')+'/></td></tr><tr><td><input type="text" maxlength="1" data-pos="p1a2" value="'+getVal('p1a2')+'" '+(isVeelHulp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o3" value="'+getVal('o3')+'" '+(isVeelHulp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o4" value="'+getVal('o4')+'" '+(isVeelHulp?'disabled':'')+'/></td></tr></table></div>';
        }
    };

    if (isVeelHulp) {
        generateTables();
    } else {
        document.getElementById('generate-tables-btn').onclick = function() {
            var inputsToDisable = document.querySelectorAll('#step1-inputs input, #step2-tree input, #step3-inputs input');
            for (var i = 0; i < inputsToDisable.length; i++) { inputsToDisable[i].disabled = true; }
            var labelsToDisable = document.querySelectorAll('#step3-inputs .choice-label');
            for (var j = 0; j < labelsToDisable.length; j++) { labelsToDisable[j].classList.add('disabled'); labelsToDisable[j].onclick = null; }
            this.disabled = true;
            generateTables();
            document.getElementById('step4-container').style.display = 'block';
            document.getElementById('step5-container').style.display = 'block';
            document.getElementById('complete-task-btn').style.display = 'block';
        };
    }
}

function renderStep5() {
    var answerContainer = document.getElementById('step5-answer');
    var html = '<p>' + currentTaskConfig.steps.step5_prompt + '</p>';
    var dom = currentTaskConfig.gene.dominant.allele; var rec = currentTaskConfig.gene.recessive.allele;
    for (var i = 0; i < currentTaskConfig.unknowns.length; i++) {
        var person = currentTaskConfig.family[currentTaskConfig.unknowns[i]];
        var name = 'final-answer-' + person.id;
        html += '<div style="margin-top: 10px;"><strong>' + person.name + ':</strong></div>' +
                '<div>' +
                '<label class="choice-label"><input type="checkbox" name="' + name + '" value="' + dom + dom + '"><span>' + dom + dom + '</span></label>' +
                '<label class="choice-label"><input type="checkbox" name="' + name + '" value="' + dom + rec + '"><span>' + dom + rec + '</span></label>' +
                '<label class="choice-label"><input type="checkbox" name="' + name + '" value="' + rec + rec + '"><span>' + rec + rec + '</span></label>' +
                '</div>';
    }
    answerContainer.innerHTML = html;
    var labels = answerContainer.getElementsByClassName('choice-label');
    for(var j = 0; j < labels.length; j++) {
        labels[j].onclick = function(e) {
            e.preventDefault();
            var input = this.querySelector('input');
            input.checked = !input.checked;
            this.classList.toggle('selected');
        }
    }
}

// --- DATA GATHERING & SUBMISSION ---

function calculateScore(data, key) {
    if (!key) return 0;
    var score = 0;
    
    // Step 1: Check known genotypes
    var s1Correct = true;
    if (!key.step1) s1Correct = false;
    else {
        for(var k in key.step1) { 
            if((data.step1[k] || "").trim() !== key.step1[k]) s1Correct = false; 
        }
    }
    if(s1Correct) score++;

    // Step 2: Check tree genotypes (knowns only)
    var s2Correct = true;
    if (!key.step2) s2Correct = false;
    else {
        // Only check fields that are NOT unknown in the task config, 
        // OR check all fields present in key.step2 that are not unknowns.
        // Simplified: check if user input matches key for all keys present in step2 of answer key
        // But wait, step2 input also has unknowns which are empty/disabled.
        // We should check match for keys in key.step2 that correspond to known family members.
        for(var k in key.step2) {
             // If this person is an unknown in the current task, we skip checking (user couldn't enter it)
             // UNLESS it's level 1/2 where unknowns are filled in step 5.
             // Actually, step 2 inputs are disabled for unknowns.
             // So we just check if user input matches key for knowns.
             if (currentTaskConfig.unknowns.indexOf(k) === -1) {
                 if((data.step2_stamboom[k] || "").trim() !== key.step2[k]) s2Correct = false;
             }
        }
    }
    if(s2Correct) score++;

    // Step 3
    var rUser = data.step3_reasoning.slice().sort().join(",");
    var rKey = key.step3.reasoning.slice().sort().join(",");
    if (rUser === rKey && parseInt(data.step3_punnett_squares_requested) === key.step3.punnett_squares) score++;

    // Step 4
    var s4Correct = true;
    var userTableKeys = Object.keys(data.step4_tables);
    // Basic check: did they fill at least one table if required?
    if (key.step4.length > 0 && userTableKeys.length === 0) {
        s4Correct = false;
    } else {
        // Compare each table. 
        for(var t in data.step4_tables) {
            var idx = parseInt(t.replace('table_', '')) - 1;
            var userTable = data.step4_tables[t];
            var keyTable = key.step4[idx];
            if (keyTable) {
                for (var cell in keyTable) { 
                    if ((userTable[cell] || "").trim() !== keyTable[cell]) s4Correct = false; 
                }
            }
        }
    }
    if(s4Correct) score++;

    // Step 5
    var s5Correct = true;
    var keyAnswers = key.step5.slice().sort();
    var userAnswers = [];
    for(var p in data.step5_final_answers) { userAnswers = userAnswers.concat(data.step5_final_answers[p]); }
    userAnswers.sort();
    
    // Simple array comparison
    if (userAnswers.length !== keyAnswers.length) s5Correct = false;
    else {
        for(var i=0; i<userAnswers.length; i++) {
            if (userAnswers[i] !== keyAnswers[i]) s5Correct = false;
        }
    }
    
    if(s5Correct) score++;
    
    return score;
}

function collectTaskData() {
    var userData = { 
        level: currentTaskConfig.level, 
        help: currentTaskConfig.help,
        task: currentTaskConfig.task,
        step1:{}, step2_stamboom:{}, step4_tables:{}, step5_final_answers:{} 
    };
    var s1=document.getElementById('step1-inputs').getElementsByTagName('input');for(var i=0;i<s1.length;i++){userData.step1[s1[i].dataset.personId]=s1[i].value;}
    var s2=document.getElementById('step2-tree').getElementsByTagName('input');for(var j=0;j<s2.length;j++){userData.step2_stamboom[s2[j].dataset.personId]=s2[j].value;}
    var r=[];var re=document.getElementsByName('reasoning');for(var k=0;k<re.length;k++){if(re[k].checked){r.push(re[k].value);}}userData.step3_reasoning=r;
    var pi=document.getElementById('punnett-squares-needed');if(pi){userData.step3_punnett_squares_requested=pi.value;}
    var ts=document.querySelectorAll('.punnett-square-table');for(var l=0;l<ts.length;l++){var td={};var ti=ts[l].getElementsByTagName('input');for(var m=0;m<ti.length;m++){td[ti[m].dataset.pos]=ti[m].value;}userData.step4_tables['table_'+(l+1)]=td;}
    var ag=document.querySelectorAll('input[name^="final-answer-"]');for(var n=0;n<ag.length;n++){var ip=ag[n];var pId=ip.name.replace('final-answer-','');if(!userData.step5_final_answers[pId]){userData.step5_final_answers[pId]=[];}if(ip.checked){userData.step5_final_answers[pId].push(ip.value);}}
    
    userData.score = calculateScore(userData, currentAnswerKey);
    return userData;
}

function completeTask() {
    finalTaskData = collectTaskData();
    // Directly submit
    document.getElementById('NextButton').click();
}

// ==========================================
// QUALTRICS HOOKS
// ==========================================

Qualtrics.SurveyEngine.addOnReady(function() {
    var that = this;
    var adaptivity = 0;
    var selectedColumn = 0;
    var currentColumn = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('CurrentColumn'));
    console.log("Current Column: "+currentColumn);
    var effort = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('Effort'+(currentTaskIndex-1)));
    var correctSteps = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('CorrectSteps'+(currentTaskIndex-1)));
    that.hideNextButton(); // Standard Qualtrics API to hide
    console.log("Adaptivity: "+Qualtrics.SurveyEngine.getEmbeddedData('Adaptivity'));
    console.log("Current Task Index: "+currentTaskIndex);
    if(currentTaskIndex>1){
        console.log("Current Column: "+currentColumn);
        console.log("Correct Steps: "+correctSteps);
        console.log("Effort: "+effort);
        //if correctSteps is between 0 and 1
        if(correctSteps >= 0 && correctSteps <= 1){
            if(effort >= 1 && effort <= 3){
                adaptivity = 0;
            }
            if(effort >= 4 && effort <= 6){
                adaptivity = -1;
            }
            if(effort >= 7 && effort <= 9){
                adaptivity = -2;
            }
        }
        //if correctSteps is between 2 and 3
        if(correctSteps >= 2 && correctSteps <= 3){
            if(effort >= 1 && effort <= 3){
                adaptivity = 1;
            }
            if(effort >= 4 && effort <= 6){
                adaptivity = 0;
            }
            if(effort >= 7 && effort <= 9){
                adaptivity = -1;
            }
        }
        //if correctSteps is between 4 and 5
        if(correctSteps >= 4 && correctSteps <= 5){
            if(effort >= 1 && effort <= 3){
                adaptivity = 2;
            }
            if(effort >= 4 && effort <= 6){
                adaptivity = 1;
            }
            if(effort >= 7 && effort <= 9){
                adaptivity = 0;
            }
        }
        selectedColumn = currentColumn + adaptivity;
        if(selectedColumn < 1) selectedColumn = 1;
        if(selectedColumn > 15) selectedColumn = 15;
        console.log("Selected Column: "+selectedColumn);
    }
    // Initialize History from Embedded Data
    var historyStr = Qualtrics.SurveyEngine.getEmbeddedData('CompletedTasks');
    if (historyStr && historyStr.trim() !== "") {
        completedTasksList = historyStr.split(',');
    }
    
    // Start main process
    injectStyles();
    document.getElementById('loop-counter-display').innerText = currentTaskIndex;
    
    Promise.all([
        fetch(mainConfigUrl).then(function(r){ return r.json(); }),
        fetch(answerKeyUrl).then(function(r){ return r.json(); })
    ]).then(function(values) {
        allConfigs = values[0];
        allAnswerKeys = values[1];
        if(Qualtrics.SurveyEngine.getEmbeddedData('Adaptivity')=="none"){            
            showLevelSelector(0);
        }
        if(Qualtrics.SurveyEngine.getEmbeddedData('Adaptivity')=="some"){
            if(currentTaskIndex>1){                
                if(adaptivity==-2)document.getElementById('suggestion').innerText = "Wir empfehlen Ihnen, eine deutlich leichtere Aufgabe auszuwählen.";
                if(adaptivity==-1)document.getElementById('suggestion').innerText = "Wir empfehlen Ihnen, eine etwas leichtere Aufgabe auszuwählen.";
                if(adaptivity==0)document.getElementById('suggestion').innerText = "Wir empfehlen Ihnen, eine ähnliche Aufgabe auszuwählen.";
                if(adaptivity==1)document.getElementById('suggestion').innerText = "Wir empfehlen Ihnen, eine etwas schwierigere Aufgabe auszuwählen.";
                if(adaptivity==2)document.getElementById('suggestion').innerText = "Wir empfehlen Ihnen, eine deutlich schwierigere Aufgabe auszuwählen.";
            }
            showLevelSelector(0);
        }
        if(Qualtrics.SurveyEngine.getEmbeddedData('Adaptivity')=="all"){
            showLevelSelector(selectedColumn);
        }
    }).catch(function(e) { 
        document.getElementById('task-wrapper').innerHTML = 'Fehler beim Laden der Konfiguration: ' + e.message; 
    });
});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    if (finalTaskData) {
        // 1. Save specific fields for this task index
        Qualtrics.SurveyEngine.setEmbeddedData('TaskOutput_' + currentTaskIndex, JSON.stringify(finalTaskData));
        Qualtrics.SurveyEngine.setEmbeddedData('TaskDifficulty_' + currentTaskIndex, finalTaskData.level);
        
        // CONVERT KEY TO READABLE TEXT
        // "veel_hulp" -> "veel hulp", "enige_hulp" -> "enige hulp", "alles_zelf" -> "alles zelf"
        var formattedHelp = finalTaskData.help.replace(/_/g, ' ');
        if(formattedHelp=="veel hulp")formattedHelp = "viel Hilfe";
        if(formattedHelp=="enige hulp")formattedHelp = "etwas Hilfe";
        if(formattedHelp=="alles zelf")formattedHelp = "alles selbst";
        Qualtrics.SurveyEngine.setEmbeddedData('TaskHelp_' + currentTaskIndex, formattedHelp);
        
        Qualtrics.SurveyEngine.setEmbeddedData('TaskType_' + currentTaskIndex, finalTaskData.task);
        Qualtrics.SurveyEngine.setEmbeddedData('TaskScore_' + currentTaskIndex, finalTaskData.score);
        console.log("final score: "+finalTaskData.score);
        // 2. Update CompletedTasks history
        if (currentTaskConfig.uniqueId) {
            completedTasksList.push(currentTaskConfig.uniqueId);
            var newHistory = completedTasksList.join(',');
            Qualtrics.SurveyEngine.setEmbeddedData('CompletedTasks', newHistory);
        }
    }
    // currentTaskIndex++;
    // Qualtrics.SurveyEngine.setEmbeddedData('CurrentTaskIndex', currentTaskIndex);
});