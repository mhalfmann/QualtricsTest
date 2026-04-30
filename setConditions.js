Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/
    
    var randomize = Qualtrics.SurveyEngine.getEmbeddedData('randomize');
    console.log('Randomize: '+randomize);
    Qualtrics.SurveyEngine.setEmbeddedData('Feedback', 'no');
    
    Qualtrics.SurveyEngine.setEmbeddedData('Adaptivity', 'none');
    //check if randomize contains "feedback"
    if(randomize.includes('feedback')){
        Qualtrics.SurveyEngine.setEmbeddedData('Feedback', 'yes');
    }
    if(randomize.includes('adaptivity')){
        Qualtrics.SurveyEngine.setEmbeddedData('Adaptivity', 'all');
    }
    console.log('Feedback: '+Qualtrics.SurveyEngine.getEmbeddedData('Feedback'));
    console.log('Adaptivity: '+Qualtrics.SurveyEngine.getEmbeddedData('Adaptivity'));
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

});