// --- USER CONTROLS ---
var totalLoops = 1;
var debugMode = true;

// --- GLOBAL CONFIGURATION & STATE ---
var mainConfigUrl = 'https://mhalfmann.github.io/QualtricsTest/mainConfigEN.json'; // Tasks
var answerKeyUrl = 'https://mhalfmann.github.io/QualtricsTest/answerKeyEN.json';  // Answers
var allConfigs = {};
var allAnswerKeys = {};
var currentTaskConfig = {};
var currentAnswerKey = {};
var currentLoop = 1;
var collectedData = [];

function injectStyles() {
    var css = '' +
        '#selection-grid-container { display: grid; grid-template-columns: repeat(15, 1fr); gap: 2px; margin-top: 15px; border: 1px solid #ccc; padding: 2px; }' +
        '.grid-header, .grid-header-sub { font-weight: bold; text-align: center; padding: 8px; color: black; }' +
        '.grid-header { grid-column: span 3; }' +
        '.grid-cell { border: 1px solid #ccc; }' +
        '.grid-cell button { width: 100%; height: 100%; padding: 10px 5px; border: 2px solid transparent; cursor: pointer; font-size: 0.9em; color: black; }' +
        '.grid-cell button:hover { border-color: #000; }' +
        '.grid-cell button:disabled { color: #555 !important; cursor: not-allowed; border-color: transparent !important; opacity: 0.7; }' +
        '.l1-s1 { background-color: #e3f2fd; } .l1-s2 { background-color: #d1e3f6; } .l1-s3 { background-color: #bbd5f0; }' +
        '.l2-s1 { background-color: #b3e5fc; } .l2-s2 { background-color: #a2c8ed; } .l2-s3 { background-color: #81d4fa; }' +
        '.l3-s1 { background-color: #81d4fa; } .l3-s2 { background-color: #73ade4; } .l3-s3 { background-color: #4fc3f7; }' +
        '.l4-s1 { background-color: #4fc3f7; } .l4-s2 { background-color: #4492db; } .l4-s3 { background-color: #29b6f6; }' +
        '.l5-s1 { background-color: #29b6f6; } .l5-s2 { background-color: #1577d2; } .l5-s3 { background-color: #03a9f4; }' +
        '.stamboom-container { font-family: sans-serif; padding: 10px 0; } .stamboom-gen { position: relative; display: flex; justify-content: center; margin: 30px 0; } .stamboom-node { border: 2px solid #666; border-radius: 8px; padding: 10px; min-width: 120px; background-color: #f9f9f9; z-index: 2; } .stamboom-node .name { font-weight: bold; } .stamboom-node .genotype-input { font-family: monospace; font-size: 1.2em; text-align: center; width: 50px; border: 1px solid #ccc; margin-top: 5px; } .stamboom-node .genotype-input:disabled { background-color: #e0e0e0; color: #333; font-weight: bold; } .stamboom-connector { display: flex; align-items: center; } .stamboom-gen:not(:last-child)::after { content: ""; position: absolute; left: 50%; top: 100%; width: 2px; height: 30px; background-color: #ccc; z-index: 1; } .stamboom-connector::before, .stamboom-connector::after { content: ""; height: 2px; background-color: #ccc; flex-grow: 1; } .stamboom-connector span { color: #666; font-size: 24px; background: #fff; z-index: 2; padding: 0 5px; margin: 0 15px; }' +
        '.choice-label { display: block; border: 2px solid #ccc; border-radius: 5px; padding: 10px; margin: 5px 0; cursor: pointer; background-color: #f9f9f9; transition: all 0.2s ease; text-align: center; }' +
        '.choice-label:hover { background-color: #e9e9e9; border-color: #999; }' +
        '.choice-label.selected { border-color: #2a7ac2; background-color: #eaf2fa; font-weight: bold; }' +
        '.choice-label input { display: none; }' +
        '.choice-label.disabled { cursor: not-allowed; background-color: #e0e0e0; color: #555; border-color: #ccc; }' +
        '.choice-label.disabled.selected { background-color: #d0d0d0; border-color: #999; }' +
        '.punnett-square-wrapper { display: inline-block; margin-right: 20px; vertical-align: top; } .punnett-square-wrapper h5{margin-top:0;text-align:center;} .punnett-square-table{border-collapse:collapse;} .punnett-square-table td{width:45px;height:45px;text-align:center;} .punnett-square-table input{width:100%;height:100%;border:1px solid #ccc;text-align:center;font-family:monospace;font-size:1.2em;box-sizing:border-box;} .punnett-square-table input:disabled { background-color: #e0e0e0; color: #333; font-weight: bold; } .punnett-square-table .corner{background-color:#f0f0f0;border:none;}';
    
    var styleElement = document.createElement('style'); styleElement.type = 'text/css'; styleElement.innerHTML = css; document.getElementsByTagName('head')[0].appendChild(styleElement);
}

function main() {
    injectStyles();
    document.getElementById('loop-counter-display').innerText = currentLoop;
    
    // Fetch both Tasks and Answers
    Promise.all([
        fetch(mainConfigUrl).then(r => r.json()),
        fetch(answerKeyUrl).then(r => r.json())
    ]).then(function(values) {
        allConfigs = values[0];
        allAnswerKeys = values[1];
        showLevelSelector();
    }).catch(function(e) { 
        document.getElementById('task-wrapper').innerHTML = 'Error loading configuration: ' + e.message; 
    });
}

function showScreen(screenId) {
    var screens = ['level-selection-screen', 'task-screen', 'effort-screen', 'complete-screen'];
    for (var i = 0; i < screens.length; i++) {
        document.getElementById(screens[i]).style.display = (screens[i] === screenId) ? 'block' : 'none';
    }
}

function showLevelSelector() {
    document.getElementById('loop-counter-display').innerText = currentLoop;
    var container = document.getElementById('selection-grid-container');
    var helpLevels = { lots_of_help: "Lots of help", some_help: "Some help", all_self: "All by myself" };
    var html = '';
    
    for (var i = 1; i <= 5; i++) { html += '<div class="grid-header level-' + i + '-header">Level ' + i + '</div>'; }
    for (var i = 1; i <= 5; i++) {
        var shade = 1;
        for (var helpKey in helpLevels) {
            html += '<div class="grid-header-sub sub-grad-' + shade + '">' + helpLevels[helpKey] + '</div>';
            shade++;
        }
    }
    
    // Determine max rows
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
                        cellContent = '<button class="sub-grad-' + shade + '" data-level="' + i + '" data-help="' + helpKey + '" data-task="' + taskKey + '">' + taskKey + '</button>';
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
            var level = this.dataset.level; var help = this.dataset.help; var task = this.dataset.task;
            currentTaskConfig = allConfigs['level' + level][help][task];
            currentTaskConfig.level = level; currentTaskConfig.help = help; currentTaskConfig.task = task;
            
            // Link to the correct answer key
            if (allAnswerKeys['level' + level] && allAnswerKeys['level' + level][help] && allAnswerKeys['level' + level][help][task]) {
                currentAnswerKey = allAnswerKeys['level' + level][help][task];
            } else {
                console.warn("No answer key found for this task!");
                currentAnswerKey = null;
            }

            this.style.borderColor = '#000';
            for (var k = 0; k < buttons.length; k++) { buttons[k].disabled = true; }
            setTimeout(function() { initializeTask(); }, 300);
        };
    }
    showScreen('level-selection-screen');
}

function initializeTask() {
    if (debugMode) {
        var debugDiv = document.getElementById('debug-info');
        debugDiv.innerHTML = 'DEBUG MODE ON | Loop: ' + currentLoop + ' | Help: ' + currentTaskConfig.help;
        debugDiv.style.display = 'block';
    } else {
        document.getElementById('debug-info').style.display = 'none';
    }
    
    var baseDesc = 'The ' + currentTaskConfig.gene.trait + ' is determined by a gene... (' + currentTaskConfig.gene.dominant.allele + ' = ' + currentTaskConfig.gene.dominant.phenotype + ', ' + currentTaskConfig.gene.recessive.allele + ' = ' + currentTaskConfig.gene.recessive.phenotype + ').<br><br>';
    document.getElementById('task-description').innerHTML = baseDesc + '<strong>Task:</strong> ' + currentTaskConfig.narrative;
    
    renderStep1(); renderStep2(); renderStep3(); renderStep5();
    
    var help = currentTaskConfig.help;
    var isLotsOfHelp = (help === 'lots_of_help');
    
    document.getElementById('step4-container').style.display = isLotsOfHelp ? 'block' : 'none';
    document.getElementById('step5-container').style.display = isLotsOfHelp ? 'block' : 'none';
    document.getElementById('complete-task-btn').style.display = isLotsOfHelp ? 'block' : 'none';

    showScreen('task-screen');
    document.getElementById('complete-task-btn').onclick = completeTask;
}

// --- RENDER FUNCTIONS WITH PRE-FILL LOGIC ---

function renderStep1() {
    var isDisabled = (currentTaskConfig.help === 'enige_hulp' || currentTaskConfig.help === 'veel_hulp');
    var html = '<p>Bepaal op basis van de omschrijving het genotype voor elk bekend individu.</p>';
    for (var key in currentTaskConfig.family) {
        if (currentTaskConfig.family.hasOwnProperty(key) && currentTaskConfig.unknowns.indexOf(key) === -1) {
            var person = currentTaskConfig.family[key];
            // Pre-fill if disabled and answer key exists
            var val = (isDisabled && currentAnswerKey) ? currentAnswerKey.step1[person.id] : "";
            html += '<div style="margin: 5px 0;"><label for="' + person.id + '_input" style="width:120px;display:inline-block;">' + person.name + ':</label><input type="text" id="' + person.id + '_input" data-person-id="' + person.id + '" value="' + val + '" maxlength="2" style="width:50px;text-align:center;font-family:monospace;font-size:1.1em;" ' + (isDisabled ? 'disabled' : '') + '/></div>';
        }
    }
    document.getElementById('step1-inputs').innerHTML = html;
}

function renderStep2() {
    var isDisabled = (currentTaskConfig.help === 'some_help' || currentTaskConfig.help === 'lots_of_help');
    var createNode = function(personId) {
        var person = currentTaskConfig.family[personId];
        var isUnknown = currentTaskConfig.unknowns.indexOf(personId) > -1;
        var placeholder = isUnknown ? '??' : '';
        // Pre-fill if disabled (knowns only)
        var val = "";
        if (isDisabled && !isUnknown && currentAnswerKey) {
            val = currentAnswerKey.step2[personId];
        }
        var finalDisabled = isUnknown || isDisabled; 
        return '<div class="stamboom-node"><div class="name">' + person.name + '</div><input type="text" class="genotype-input" id="' + person.id + '_tree_input" data-person-id="' + person.id + '" value="' + val + '" placeholder="' + placeholder + '" maxlength="2" ' + (finalDisabled ? 'disabled' : '') + '/></div>';
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
    var isLotsOfHelp = (currentTaskConfig.help === 'lots_of_help');
    var container = document.getElementById('step3-inputs');
    var buttonHtml = '<button type="button" id="generate-tables-btn" style="margin-left: 10px;" ' + (isLotsOfHelp ? 'disabled style="display:none;"' : '') + '>Generate Tables</button>';
    
    // Pre-fill values for Lots of Help
    var valCount = (isLotsOfHelp && currentAnswerKey) ? currentAnswerKey.step3.punnett_squares : "";
    var correctReasoning = (currentAnswerKey) ? currentAnswerKey.step3.reasoning : [];
    
    container.innerHTML = '<p>Determine the reasoning direction(s) and how many Punnett squares you need.</p>' +
                          '<div style="margin-bottom: 10px;"><strong>Direction:</strong>' +
                          '<label class="choice-label ' + (isLotsOfHelp ? 'disabled' : '') + '"><input type="checkbox" name="reasoning" value="deductive" ' + (isLotsOfHelp ? 'disabled' : '') + '><span>Deductive</span></label>' +
                          '<label class="choice-label ' + (isLotsOfHelp ? 'disabled' : '') + '"><input type="checkbox" name="reasoning" value="inductive" ' + (isLotsOfHelp ? 'disabled' : '') + '><span>Inductive</span></label></div>' +
                          '<div><strong>Number of Punnett squares:</strong> <input type="number" id="punnett-squares-needed" value="'+valCount+'" min="0" max="10" style="width:50px;" ' + (isLotsOfHelp ? 'disabled' : '') + '> ' + buttonHtml + '</div>';
    
    // Check boxes if Lots of Help
    if (isLotsOfHelp && currentAnswerKey) {
        var checkboxes = container.querySelectorAll('input[name="reasoning"]');
        for (var i = 0; i < checkboxes.length; i++) {
            if (correctReasoning.indexOf(checkboxes[i].value) > -1) {
                checkboxes[i].checked = true;
                checkboxes[i].parentElement.classList.add('selected');
            }
        }
    } else {
        var labels = container.getElementsByClassName('choice-label');
        for(var j = 0; j < labels.length; j++) {
            labels[j].onclick = function(e) { e.preventDefault(); var input = this.querySelector('input'); input.checked = !input.checked; this.classList.toggle('selected'); }
        }
    }

    var generateTables = function() {
        var numTables = currentTaskConfig.punnett_squares_needed;
        var pContainer = document.getElementById('step4-punnett-squares');
        pContainer.innerHTML = numTables > 0 ? '<p>Fill in the alleles and possible genotypes.</p>' : '';
        
        var answerTables = (isLotsOfHelp && currentAnswerKey) ? currentAnswerKey.step4 : [];

        for (var k = 0; k < numTables; k++) {
            var tVal = (answerTables[k]) ? answerTables[k] : {}; // Get pre-fill values for this table
            
            var getVal = function(key) { return (isLotsOfHelp && tVal[key]) ? tVal[key] : ""; };
            
            pContainer.innerHTML += '<div class="punnett-square-wrapper"><h5>Punnett square ' + (k + 1) + '</h5><table class="punnett-square-table"><tr><td class="corner"></td><td><input type="text" maxlength="1" data-pos="p2a1" value="'+getVal('p2a1')+'" '+(isLotsOfHelp?'disabled':'')+'/></td><td><input type="text" maxlength="1" data-pos="p2a2" value="'+getVal('p2a2')+'" '+(isLotsOfHelp?'disabled':'')+'/></td></tr><tr><td><input type="text" maxlength="1" data-pos="p1a1" value="'+getVal('p1a1')+'" '+(isLotsOfHelp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o1" value="'+getVal('o1')+'" '+(isLotsOfHelp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o2" value="'+getVal('o2')+'" '+(isLotsOfHelp?'disabled':'')+'/></td></tr><tr><td><input type="text" maxlength="1" data-pos="p1a2" value="'+getVal('p1a2')+'" '+(isLotsOfHelp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o3" value="'+getVal('o3')+'" '+(isLotsOfHelp?'disabled':'')+'/></td><td><input type="text" maxlength="2" data-pos="o4" value="'+getVal('o4')+'" '+(isLotsOfHelp?'disabled':'')+'/></td></tr></table></div>';
        }
    };

    if (isLotsOfHelp) {
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

// --- SCORING LOGIC ---
function calculateScore(data, key) {
    if (!key) return 0;
    var score = 0;

    // Step 1 (1 point if all knowns match)
    var s1Correct = true;
    for(var k in key.step1) {
        if((data.step1[k] || "").trim() !== key.step1[k]) s1Correct = false;
    }
    if(s1Correct) score++;

    // Step 2 (1 point if all knowns match)
    var s2Correct = true;
    for(var k in key.step2) {
        if((data.step2_stamboom[k] || "").trim() !== key.step2[k]) s2Correct = false;
    }
    if(s2Correct) score++;

    // Step 3 (1 point if count AND reasoning match)
    var rUser = data.step3_reasoning.slice().sort().join(",");
    var rKey = key.step3.reasoning.slice().sort().join(",");
    var cUser = parseInt(data.step3_punnett_squares_requested);
    if (rUser === rKey && cUser === key.step3.punnett_squares) score++;

    // Step 4 (1 point if at least one valid table configuration matches)
    // Note: This is simplified. We assume user filled tables sequentially.
    // We check if table 1 matches key table 1, etc.
    var s4Correct = true;
    for(var t in data.step4_tables) {
        // Find index (table_1 -> 0)
        var idx = parseInt(t.replace('table_', '')) - 1;
        var userTable = data.step4_tables[t];
        var keyTable = key.step4[idx]; // This assumes order. 
        if (keyTable) {
            for (var cell in keyTable) {
                if ((userTable[cell] || "").trim() !== keyTable[cell]) s4Correct = false;
            }
        }
    }
    if (Object.keys(data.step4_tables).length === 0) s4Correct = false;
    if (s4Correct) score++;

    // Step 5 (1 point if exact match on answers)
    // This assumes unknowns order matters or we check per person
    var s5Correct = true;
    var keyAnswers = key.step5.slice().sort(); // Expected e.g. ["Bb", "bb"]
    
    // Flatten user answers from all unknowns into one array to compare
    var userAnswers = [];
    for(var p in data.step5_final_answers) {
        userAnswers = userAnswers.concat(data.step5_final_answers[p]);
    }
    userAnswers.sort();
    
    if (JSON.stringify(userAnswers) !== JSON.stringify(keyAnswers)) s5Correct = false;
    if (s5Correct) score++;

    return score;
}

function collectTaskData() {
    var userData = { 
        level_selected: currentTaskConfig.level, 
        help_selected: currentTaskConfig.help,
        task_selected: currentTaskConfig.task,
        step1:{}, step2_stamboom:{}, step4_tables:{}, step5_final_answers:{} 
    };
    var s1=document.getElementById('step1-inputs').getElementsByTagName('input');for(var i=0;i<s1.length;i++){userData.step1[s1[i].dataset.personId]=s1[i].value;}
    var s2=document.getElementById('step2-tree').getElementsByTagName('input');for(var j=0;j<s2.length;j++){userData.step2_stamboom[s2[j].dataset.personId]=s2[j].value;}
    var r=[];var re=document.getElementsByName('reasoning');for(var k=0;k<re.length;k++){if(re[k].checked){r.push(re[k].value);}}userData.step3_reasoning=r;
    var pi=document.getElementById('punnett-squares-needed');if(pi){userData.step3_punnett_squares_requested=pi.value;}
    var ts=document.querySelectorAll('.punnett-square-table');for(var l=0;l<ts.length;l++){var td={};var ti=ts[l].getElementsByTagName('input');for(var m=0;m<ti.length;m++){td[ti[m].dataset.pos]=ti[m].value;}userData.step4_tables['table_'+(l+1)]=td;}
    var ag=document.querySelectorAll('input[name^="final-answer-"]');for(var n=0;n<ag.length;n++){var ip=ag[n];var pId=ip.name.replace('final-answer-','');if(!userData.step5_final_answers[pId]){userData.step5_final_answers[pId]=[];}if(ip.checked){userData.step5_final_answers[pId].push(ip.value);}}
    
    // Calculate Score (0-5)
    userData.score = calculateScore(userData, currentAnswerKey);
    
    return userData;
}

function completeTask() {
    var taskData = collectTaskData();
    showEffortQuestion(taskData);
}

function showEffortQuestion(taskData) {
    var content = document.getElementById('effort-question-content');
    var html = '<h4 style="margin-bottom: 20px;">How much effort did it take you to complete this biology task?</h4>';
    
    html += '<div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-top: 1px solid #eee; padding-top: 15px;">';
    var scaleLabels = { 1: "Very<br>little", 3: "Little", 5: "Neutral", 7: "Much", 9: "Very<br>much" };

    for (var i = 1; i <= 9; i++) {
        var labelText = scaleLabels[i] ? scaleLabels[i] : "";
        html += '<div style="flex: 1; display: flex; flex-direction: column; align-items: center;">';
        html +=   '<div style="height: 40px; display: flex; align-items: flex-end; justify-content: center; font-size: 0.9em; line-height: 1.1; margin-bottom: 5px; text-align: center;">' + labelText + '</div>';
        html +=   '<div style="font-weight: bold; margin-bottom: 5px;">' + i + '</div>';
        html +=   '<label class="choice-label" style="width: 30px; height: 30px; border-radius: 50%; padding: 0; display: flex; justify-content: center; align-items: center;">';
        html +=     '<input type="radio" name="effort" value="' + i + '">';
        html +=   '</label>';
        html += '</div>';
    }
    html += '</div>';

    html += '<h4 style="margin-top:30px;">How many of the 5 steps do you think you had correct?</h4>';
    html += '<div>';
    for(var k=0; k<=5; k++) {
        html += '<label class="choice-label"><input type="radio" name="correct" value="'+k+'"><span>'+k+(k===1?' step':' steps')+'</span></label>';
    }
    html += '</div>';
    
    content.innerHTML = html;
    
    var labels = content.getElementsByClassName('choice-label');
    for(var j = 0; j < labels.length; j++) {
        labels[j].onclick = function(e) {
            e.preventDefault();
            var input = this.querySelector('input');
            var groupName = input.name;
            var allInputs = content.querySelectorAll('input[name="' + groupName + '"]');
            for(var m=0; m < allInputs.length; m++) {
                allInputs[m].parentElement.classList.remove('selected');
            }
            input.checked = true;
            this.classList.add('selected');
        }
    }
    
    showScreen('effort-screen');
    document.getElementById('submit-effort-btn').onclick = function() { submitEffort(taskData); };
}

function submitEffort(taskData) {
    var effort = document.querySelector('input[name="effort"]:checked');
    var correct = document.querySelector('input[name="correct"]:checked');
    taskData.effort_rating = effort ? effort.value : null;
    taskData.perceived_correct = correct ? correct.value : null;
    collectedData.push(taskData);
    if (currentLoop < totalLoops) {
        currentLoop++;
        showLevelSelector();
    } else {
        finishExperiment();
    }
}

function finishExperiment() {
    for (var i = 0; i < collectedData.length; i++) {
        var round = i + 1;
        var fieldName = 'TaskOutput_' + round;
        Qualtrics.SurveyEngine.setEmbeddedData(fieldName, JSON.stringify(collectedData[i]));
    }
    showScreen('complete-screen');
}

// --- Qualtrics Hooks ---
Qualtrics.SurveyEngine.addOnReady(function() {
    main();
});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    console.log("Submitting final data for all loops.");
});