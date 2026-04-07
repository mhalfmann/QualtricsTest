Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/
	console.log("hello world");

});

Qualtrics.SurveyEngine.addOnReady(function()
{
    var currentScore = Qualtrics.SurveyEngine.getEmbeddedData('CurrentScore');
    var correctSteps = Qualtrics.SurveyEngine.getEmbeddedData('CorrectSteps'+(currentTaskIndex-1));
    var step1correct = Qualtrics.SurveyEngine.getEmbeddedData('Step1correct') == 'true' ? true : false;
    var step2correct = Qualtrics.SurveyEngine.getEmbeddedData('Step2correct') == 'true' ? true : false;
    var step3correct = Qualtrics.SurveyEngine.getEmbeddedData('Step3correct') == 'true' ? true : false;
    var step4correct = Qualtrics.SurveyEngine.getEmbeddedData('Step4correct') == 'true' ? true : false;
    var step5correct = Qualtrics.SurveyEngine.getEmbeddedData('Step5correct') == 'true' ? true : false;
    var feedback = "";
    if(currentScore == correctSteps){
        feedback = "Ihre Selbstbewertung war korrekt.";
    }
    else if(currentScore !=correctSteps){
        feedback = "Ihre Selbstbewertung war inkorrekt.";
     }
     
     document.getElementById('feedbacktext').innerText = feedback + " Sie haben "+currentScore +" Schritte richtig gelöst.";

     var stepLabelsDe = [
         'Genotyp übersetzen',
         'Stammbaum',
         'Begründung',
         'Punnett-Quadrate',
         'Antwort aus der Tabelle'
     ];
     var stepFlags = [step1correct, step2correct, step3correct, step4correct, step5correct];
     for (var si = 0; si < 5; si++) {
         document.getElementById('step' + (si + 1) + 'correct').innerText =
             (si + 1) + '. ' + stepLabelsDe[si] + ' ' + (stepFlags[si] ? '\u2705' : '\u274C');
     }
	/*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});