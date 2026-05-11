Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/

});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	
	/*Place your JavaScript here to run when the page is unloaded*/

});
Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    var selectedChoiceId = this.getSelectedChoices()[0];

    // Use the Qualtrics recode value, not the internal choice ID.
    // Recode values should equal the actual number of correct steps.
    var selectedValue = parseInt(this.getChoiceRecodeValue(selectedChoiceId), 10);

    var idx = Qualtrics.SurveyEngine.getEmbeddedData('LastCompletedTaskIndex');
    if (!idx) {
        idx = Qualtrics.SurveyEngine.getEmbeddedData('CurrentTaskIndex');
    }

    var embeddedDataName = 'CorrectSteps_' + idx;

    console.log('Saving ' + embeddedDataName + ' = ' + selectedValue);

    Qualtrics.SurveyEngine.setEmbeddedData(embeddedDataName, selectedValue);
});
