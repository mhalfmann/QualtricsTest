Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/

});

Qualtrics.SurveyEngine.addOnReady(function()
{
    var container = this.getQuestionContainer();
    window._effortValue = null;

    var radios = Array.prototype.slice.call(container.querySelectorAll('input[type="radio"]'));

    // Count distinct radio values to determine how many unique choices exist.
    // Qualtrics sometimes duplicates radios (e.g. for mobile/desktop layouts),
    // so we use index % uniqueCount to map any radio to its 1-based scale position.
    var seen = {};
    var uniqueCount = 0;
    radios.forEach(function(r) {
        if (!seen[r.value]) { seen[r.value] = true; uniqueCount++; }
    });

    console.log("Effort: found " + radios.length + " radios, " + uniqueCount + " unique choices");

    radios.forEach(function(radio, idx) {
        radio.addEventListener('click', function() {
            var pos = (idx % uniqueCount) + 1;
            window._effortValue = pos;
            console.log("Effort: clicked idx=" + idx + " → scale value=" + pos);
        });
    });
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    if (window._effortValue != null) {
        Qualtrics.SurveyEngine.setEmbeddedData('Effort1', window._effortValue);
        console.log("Effort saved: " + window._effortValue);
    }
});
