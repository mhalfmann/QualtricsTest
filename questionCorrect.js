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
    var value = this.getSelectedChoices(); // returns array, e.g. ["3"]
    var selectedValue = parseInt(value[0]) + 3; // the selected choice ID
	console.log(selectedValue); 
	Qualtrics.SurveyEngine.setEmbeddedData('NumQuestions', selectedValue);
});