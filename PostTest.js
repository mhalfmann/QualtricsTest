// ==========================================
// GLOBAL VARIABLES (Shared Scope)
// ==========================================

// --- USER CONFIGURATION ---
// Ausgabe in Embedded Data (z. B. TaskOutput_1) – wie bei der Hauptstudie.
var currentTaskIndex = parseInt(Qualtrics.SurveyEngine.getEmbeddedData('CurrentTaskIndex'), 10);
if (isNaN(currentTaskIndex)) currentTaskIndex = 1;

// Beim Laden: Embedded Data "PostTestIndex" lesen, +1, wieder speichern; der neue Wert (1-basiert)
// wählt die Aufgabe in postTestConfig / postTestAnswerKey (erstes Leeren → 0 → nach +1 = 1).
// Hilfe ist immer „alles selbst“. Ausgabe: level = JSON-Feld "level" (Pflicht pro Aufgabe); task = gene.trait.
var debugMode = false;
// true: Button „Aufgabe abschließen“ immer aktiv, Klick ohne vollständige Kreuztabellen/Finalantworten (nur zum Testen).
var skipCompleteTaskValidation = false;

// --- CONSTANTS ---
var postTestConfigUrl = 'https://mhalfmann.github.io/QualtricsTest/postTestConfig.json';
var postTestAnswerKeyUrl = 'https://mhalfmann.github.io/QualtricsTest/postTestAnswerKey.json';

// --- STATE ---
var currentTaskConfig = {};
var currentAnswerKey = null;

// This object will hold the final data to be saved in addOnPageSubmit
var finalTaskData = null; 

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function injectStyles() {
    var css = '' +
        '.stamboom-container { font-family: sans-serif; padding: 10px 0; } .stamboom-gen { position: relative; display: flex; justify-content: center; margin: 30px 0; } .stamboom-node { border: 2px solid #666; border-radius: 8px; padding: 10px; min-width: 120px; background-color: #f9f9f9; z-index: 2; } .stamboom-node .name { font-weight: bold; } .stamboom-node .genotype-input { font-family: monospace; font-size: 1.2em; text-align: center; width: 50px; border: 1px solid #ccc; margin-top: 5px; } .stamboom-node .genotype-input:disabled { background-color: #e0e0e0; color: #333; font-weight: bold; } .stamboom-connector { display: flex; align-items: center; } .stamboom-gen:not(:last-child)::after { content: ""; position: absolute; left: 50%; top: 100%; width: 2px; height: 30px; background-color: #ccc; z-index: 1; } .stamboom-connector::before, .stamboom-connector::after { content: ""; height: 2px; background-color: #ccc; flex-grow: 1; } .stamboom-connector span { color: #666; font-size: 24px; background: #fff; z-index: 2; padding: 0 5px; margin: 0 15px; }' +
        '.choice-label { display: block; border: 2px solid #ccc; border-radius: 5px; padding: 10px; margin: 5px 0; cursor: pointer; background-color: #f9f9f9; transition: all 0.2s ease; text-align: center; }' +
        '.choice-label:hover { background-color: #e9e9e9; border-color: #999; }' +
        '.choice-label.selected { border-color: #2a7ac2; background-color: #eaf2fa; font-weight: bold; }' +
        '.choice-label input { display: none; }' +
        '.choice-label.disabled { cursor: not-allowed; background-color: #e0e0e0; color: #555; border-color: #ccc; }' +
        '.punnett-square-wrapper { display: inline-block; margin-right: 20px; vertical-align: top; } .punnett-square-wrapper h5{margin-top:0;text-align:center;} .punnett-square-table{border-collapse:collapse;} .punnett-square-table td{width:45px;height:45px;text-align:center;} .punnett-square-table input{width:100%;height:100%;border:1px solid #ccc;text-align:center;font-family:monospace;font-size:1.2em;box-sizing:border-box;} .punnett-square-table input:disabled { background-color: #e0e0e0; color: #333; font-weight: bold; } .punnett-square-table .corner{background-color:#f0f0f0;border:none;}' +
        '#generate-tables-btn:disabled { background-color: #e0e0e0 !important; color: #999 !important; cursor: not-allowed; border-color: #ddd !important; }';
    
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

function bumpPostTestIndex1Based() {
    var raw = Qualtrics.SurveyEngine.getEmbeddedData('PostTestIndex');
    var prev = parseInt(raw, 10);
    if (isNaN(prev) || prev < 0) prev = 0;
    var n = prev + 1;
    Qualtrics.SurveyEngine.setEmbeddedData('PostTestIndex', String(n));
    return n;
}

function startPostTestFromArrays(configArray, answerKeyArray) {
    var n = bumpPostTestIndex1Based();
    var i = n - 1;
    var count = configArray ? configArray.length : 0;
    if (!configArray || !answerKeyArray || !Array.isArray(configArray) || !Array.isArray(answerKeyArray)) {
        document.getElementById('task-wrapper').innerHTML = 'Post-Test: Konfiguration muss ein JSON-Array sein.';
        return;
    }
    if (configArray.length !== answerKeyArray.length) {
        document.getElementById('task-wrapper').innerHTML = 'Post-Test: postTestConfig und postTestAnswerKey haben unterschiedliche Längen.';
        return;
    }
    if (i < 0 || i >= configArray.length) {
        document.getElementById('task-wrapper').innerHTML = 'Post-Test: Index ' + n + ' ungültig (verfügbar: 1–' + count + ').';
        return;
    }

    var entry = configArray[i];
    currentTaskConfig = JSON.parse(JSON.stringify(entry));
    var taskId = (entry.id !== undefined && entry.id !== null) ? String(entry.id) : String(n);
    var complexityLevel = (entry.level !== undefined && entry.level !== null) ? String(entry.level) : taskId;
    var traitLabel = (entry.gene && entry.gene.trait) ? entry.gene.trait : taskId;
    delete currentTaskConfig.help;
    delete currentTaskConfig.id;
    currentTaskConfig.level = complexityLevel;
    currentTaskConfig.help = 'alles_zelf';
    currentTaskConfig.task = traitLabel;
    currentTaskConfig.uniqueId = 'post_' + taskId;

    currentAnswerKey = answerKeyArray[i];

    var levelSel = document.getElementById('level-selection-screen');
    if (levelSel) levelSel.style.display = 'none';

    var loopEl = document.getElementById('loop-counter-display');
    if (loopEl) loopEl.innerText = String(n);

    initializeTask();
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
    ensureCompleteTaskValidationListeners();
    updateCompleteTaskButtonState();
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
    var buttonHtml = '<button type="button" id="generate-tables-btn" ' +
        (isVeelHulp ? 'style="margin-left: 10px; display: none;" disabled' : 'style="margin-left: 10px;" disabled') +
        '>Tabellen generieren</button>';
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
        for (var j = 0; j < labels.length; j++) {
            labels[j].onclick = function(e) {
                e.preventDefault();
                var inp = this.querySelector('input');
                inp.checked = !inp.checked;
                this.classList.toggle('selected');
                updateGenerateTablesButtonState();
            };
        }
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
            if (!isSteps123Complete()) return;
            var inputsToDisable = document.querySelectorAll('#step1-inputs input, #step2-tree input, #step3-inputs input');
            for (var i = 0; i < inputsToDisable.length; i++) { inputsToDisable[i].disabled = true; }
            var labelsToDisable = document.querySelectorAll('#step3-inputs .choice-label');
            for (var j = 0; j < labelsToDisable.length; j++) { labelsToDisable[j].classList.add('disabled'); labelsToDisable[j].onclick = null; }
            this.disabled = true;
            generateTables();
            document.getElementById('step4-container').style.display = 'block';
            document.getElementById('step5-container').style.display = 'block';
            document.getElementById('complete-task-btn').style.display = 'block';
            updateCompleteTaskButtonState();
        };
        updateGenerateTablesButtonState();
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
            updateCompleteTaskButtonState();
        }
    }
    updateCompleteTaskButtonState();
}

function isStep1KnownGenotypesComplete() {
    var inputs = document.querySelectorAll('#step1-inputs input');
    for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        if (el.disabled) continue;
        if ((el.value || '').trim().length !== 2) return false;
    }
    return true;
}

function isStep2TreeKnownGenotypesComplete() {
    var inputs = document.querySelectorAll('#step2-tree input');
    for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        if (el.disabled) continue;
        if ((el.value || '').trim().length !== 2) return false;
    }
    return true;
}

function isStep3ReasoningAndCountComplete() {
    var container = document.getElementById('step3-inputs');
    if (!container) return false;
    var checked = container.querySelectorAll('input[name="reasoning"]:checked');
    if (!checked || checked.length === 0) return false;
    var pi = document.getElementById('punnett-squares-needed');
    if (!pi || pi.disabled) return true;
    var raw = (pi.value || '').trim();
    if (raw === '') return false;
    var n = parseInt(raw, 10);
    if (isNaN(n) || n < 0 || n > 10) return false;
    return true;
}

function isSteps123Complete() {
    return isStep1KnownGenotypesComplete() && isStep2TreeKnownGenotypesComplete() && isStep3ReasoningAndCountComplete();
}

function updateGenerateTablesButtonState() {
    var btn = document.getElementById('generate-tables-btn');
    if (!btn) return;
    if (currentTaskConfig && currentTaskConfig.help === 'veel_hulp') return;
    if (btn.style.display === 'none') return;
    btn.disabled = !isSteps123Complete();
}

function isStep4PunnettComplete() {
    var inputs = document.querySelectorAll('.punnett-square-table input');
    if (inputs.length === 0) return true;
    for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        var v = (el.value || '').trim();
        if (el.disabled) {
            if (!v) return false;
        } else {
            if (!v) return false;
        }
    }
    return true;
}

function isStep5FinalAnswersComplete() {
    if (!currentTaskConfig || !currentTaskConfig.unknowns || currentTaskConfig.unknowns.length === 0) return true;
    for (var i = 0; i < currentTaskConfig.unknowns.length; i++) {
        var pid = currentTaskConfig.unknowns[i];
        var person = currentTaskConfig.family[pid];
        if (!person) return false;
        if (!document.querySelector('input[name="final-answer-' + person.id + '"]:checked')) return false;
    }
    return true;
}

function updateCompleteTaskButtonState() {
    var btn = document.getElementById('complete-task-btn');
    if (!btn) return;
    if (btn.style.display === 'none') return;
    if (skipCompleteTaskValidation) {
        btn.disabled = false;
        return;
    }
    btn.disabled = !(isStep4PunnettComplete() && isStep5FinalAnswersComplete());
}

function ensureCompleteTaskValidationListeners() {
    var p1 = document.getElementById('step1-inputs');
    var p2 = document.getElementById('step2-tree');
    var p3 = document.getElementById('step3-inputs');
    var p4 = document.getElementById('step4-punnett-squares');
    var p5 = document.getElementById('step5-answer');
    if (p1 && !p1.dataset.validationBound) {
        p1.dataset.validationBound = '1';
        p1.addEventListener('input', updateGenerateTablesButtonState);
        p1.addEventListener('change', updateGenerateTablesButtonState);
    }
    if (p2 && !p2.dataset.validationBound) {
        p2.dataset.validationBound = '1';
        p2.addEventListener('input', updateGenerateTablesButtonState);
        p2.addEventListener('change', updateGenerateTablesButtonState);
    }
    if (p3 && !p3.dataset.validationBound) {
        p3.dataset.validationBound = '1';
        p3.addEventListener('input', updateGenerateTablesButtonState);
        p3.addEventListener('change', updateGenerateTablesButtonState);
    }
    if (p4 && !p4.dataset.validationBound) {
        p4.dataset.validationBound = '1';
        p4.addEventListener('input', updateCompleteTaskButtonState);
        p4.addEventListener('change', updateCompleteTaskButtonState);
    }
    if (p5 && !p5.dataset.validationBound) {
        p5.dataset.validationBound = '1';
        p5.addEventListener('change', updateCompleteTaskButtonState);
    }
}

// --- DATA GATHERING & SUBMISSION ---

/** Level 1–4: step5 is string[]. Level 5: step5 is { f1_child: string[], f1_partner: string[], ... }. */
function normalizeStep5KeyAnswers(step5) {
    if (!step5) return [];
    if (Array.isArray(step5)) return step5.slice().sort();
    var out = [];
    for (var p in step5) {
        if (Object.prototype.hasOwnProperty.call(step5, p) && Array.isArray(step5[p])) {
            out = out.concat(step5[p]);
        }
    }
    return out.sort();
}

function calculateScore(data, key) {
    if (!key) return 0;
    var score = 0;
    
    // Step 1: Check known genotypes
    var s1Correct = true;
    Qualtrics.SurveyEngine.setEmbeddedData('Step1correct', 'false');
    if (!key.step1) s1Correct = false;
    else {
        for(var k in key.step1) { 
            if((data.step1[k] || "").trim() !== key.step1[k]) s1Correct = false; 
            console.log("checking Step 1: "+k+" "+data.step1[k] + " " + key.step1[k]);
            console.log("s1Correct: "+s1Correct);
        }
    }
    if(s1Correct) {
        score++;
        Qualtrics.SurveyEngine.setEmbeddedData('Step1correct', 'true');
    }

    // Step 2: Check tree genotypes (knowns only)
    var s2Correct = true;
    Qualtrics.SurveyEngine.setEmbeddedData('Step2correct', 'false');
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
             //if data.step2_stamboom[k] is undefined, consolelog ("data.step2_stamboom["+k+"] is undefined");
             if (data.step2_stamboom[k] !== undefined) {
                // console.log("data.step2_stamboom["+k+"] is not undefined");
             
                if (currentTaskConfig.unknowns.indexOf(k) === -1) {
                    if((data.step2_stamboom[k] || "").trim() !== key.step2[k]) s2Correct = false;
                }
                // console.log("checking Step 2: "+k+" "+data.step2_stamboom[k] + " " + key.step2[k]);
                // console.log("s2Correct: "+s2Correct);
            }
        }
    }
    if(s2Correct) {
        score++;
        Qualtrics.SurveyEngine.setEmbeddedData('Step2correct', 'true');
    }

    // Step 3
    
    Qualtrics.SurveyEngine.setEmbeddedData('Step3correct', 'false');
    var rUser = data.step3_reasoning.slice().sort().join(",");
    var rKey = key.step3.reasoning.slice().sort().join(",");
    if (rUser === rKey && parseInt(data.step3_punnett_squares_requested) === key.step3.punnett_squares) {
        score++;
        Qualtrics.SurveyEngine.setEmbeddedData('Step3correct', 'true');
    }

    // Step 4
    var s4Correct = true;
    Qualtrics.SurveyEngine.setEmbeddedData('Step4correct', 'false');
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
    if(s4Correct) {
        score++;
        Qualtrics.SurveyEngine.setEmbeddedData('Step4correct', 'true');
    }

    // Step 5
    var s5Correct = true;
    Qualtrics.SurveyEngine.setEmbeddedData('Step5correct', 'false');
    var keyAnswers = normalizeStep5KeyAnswers(key.step5);
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
    
    if(s5Correct) {
        score++;
        Qualtrics.SurveyEngine.setEmbeddedData('Step5correct', 'true');
    }
    Qualtrics.SurveyEngine.setEmbeddedData('CurrentScore', score);
    return score;
}

function collectTaskData() {
    var userData = { 
        level: currentTaskConfig.level, 
        help: currentTaskConfig.help,
        task: currentTaskConfig.task,
        step1:{}, step2_stamboom:{}, step4_tables:{}, step5_final_answers:{} 
    };
    console.log("dataset: "+this.dataset);
    var s1=document.getElementById('step1-inputs').getElementsByTagName('input');for(var i=0;i<s1.length;i++){console.log("s1["+i+"].value: "+s1[i].value + " s1["+i+"].dataset.personId: " + s1[i].dataset.personId);userData.step1[s1[i].dataset.personId]=s1[i].value;}
    var s2=document.getElementById('step2-tree').getElementsByTagName('input');for(var j=0;j<s2.length;j++){/*console.log("s2["+j+"].value: "+s2[j].value + " s2["+j+"].dataset.personId: " + s2[j].dataset.personId);*/userData.step2_stamboom[s2[j].dataset.personId]=s2[j].value;}
    var r=[];var re=document.getElementsByName('reasoning');for(var k=0;k<re.length;k++){if(re[k].checked){r.push(re[k].value);}}userData.step3_reasoning=r;
    var pi=document.getElementById('punnett-squares-needed');if(pi){userData.step3_punnett_squares_requested=pi.value;}
    var ts=document.querySelectorAll('.punnett-square-table');for(var l=0;l<ts.length;l++){var td={};var ti=ts[l].getElementsByTagName('input');for(var m=0;m<ti.length;m++){td[ti[m].dataset.pos]=ti[m].value;}userData.step4_tables['table_'+(l+1)]=td;}
    var ag=document.querySelectorAll('input[name^="final-answer-"]');for(var n=0;n<ag.length;n++){var ip=ag[n];var pId=ip.name.replace('final-answer-','');if(!userData.step5_final_answers[pId]){userData.step5_final_answers[pId]=[];}if(ip.checked){userData.step5_final_answers[pId].push(ip.value);}}
    
    userData.score = calculateScore(userData, currentAnswerKey);
    return userData;
}

function completeTask() {
    var btn = document.getElementById('complete-task-btn');
    if (btn && btn.disabled) return;
    if (!skipCompleteTaskValidation && (!isStep4PunnettComplete() || !isStep5FinalAnswersComplete())) return;
    finalTaskData = collectTaskData();
    document.getElementById('NextButton').click();
}

// ==========================================
// QUALTRICS HOOKS
// ==========================================

Qualtrics.SurveyEngine.addOnReady(function() {
    var that = this;
    that.hideNextButton(); // Standard Qualtrics API to hide
    
    // Start main process
    injectStyles();

    Promise.all([
        fetch(postTestConfigUrl).then(function(r){ return r.json(); }),
        fetch(postTestAnswerKeyUrl).then(function(r){ return r.json(); })
    ]).then(function(values) {
        startPostTestFromArrays(values[0], values[1]);
    }).catch(function(e) {
        document.getElementById('task-wrapper').innerHTML = 'Fehler beim Laden der Post-Test-Konfiguration: ' + e.message;
    });
});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    if (finalTaskData) {
        // 1. Save specific fields for this task index
        Qualtrics.SurveyEngine.setEmbeddedData('TaskOutputPostTest_' + currentTaskIndex, JSON.stringify(finalTaskData));
        Qualtrics.SurveyEngine.setEmbeddedData('TaskDifficultyPostTest_' + currentTaskIndex, finalTaskData.level);
        
        // CONVERT KEY TO READABLE TEXT
        // "veel_hulp" -> "veel hulp", "enige_hulp" -> "enige hulp", "alles_zelf" -> "alles zelf"
        var formattedHelp = finalTaskData.help.replace(/_/g, ' ');
        if(formattedHelp=="veel hulp")formattedHelp = "viel Hilfe";
        if(formattedHelp=="enige hulp")formattedHelp = "etwas Hilfe";
        if(formattedHelp=="alles zelf")formattedHelp = "alles selbst";
        Qualtrics.SurveyEngine.setEmbeddedData('TaskHelpPostTest_' + currentTaskIndex, formattedHelp);
        
        Qualtrics.SurveyEngine.setEmbeddedData('TaskTypePostTest_' + currentTaskIndex, finalTaskData.task);
        Qualtrics.SurveyEngine.setEmbeddedData('TaskScorePostTest_' + currentTaskIndex, finalTaskData.score);
        console.log("final score: "+finalTaskData.score);
        console.log("finalTaskData: "+JSON.stringify(finalTaskData));
       
    }
    // currentTaskIndex++;
    // Qualtrics.SurveyEngine.setEmbeddedData('CurrentTaskIndex', currentTaskIndex);
});