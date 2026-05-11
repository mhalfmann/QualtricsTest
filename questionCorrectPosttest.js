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

    var selectedValue = parseInt(this.getChoiceRecodeValue(selectedChoiceId), 10);

    var embeddedDataName =
        'CorrectStepsPosttest_' + Qualtrics.SurveyEngine.getEmbeddedData('PostTestIndex');

    console.log('Saving ' + embeddedDataName + ' = ' + selectedValue);

    Qualtrics.SurveyEngine.setEmbeddedData(embeddedDataName, selectedValue);
});
