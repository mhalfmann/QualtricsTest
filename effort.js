Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/

});

var effortContainer = null;
var effortRadios = [];
var effortValueToPosition = {};
var effortUniqueCount = 0;

Qualtrics.SurveyEngine.addOnReady(function()
{
    effortContainer = this.getQuestionContainer();
    window._effortValue = null;

    effortRadios = Array.prototype.slice.call(
        effortContainer.querySelectorAll('input[type="radio"]')
    );

    // Count distinct radio values and map each Qualtrics radio value
    // to its 1-based scale position.
    // This is more robust than relying only on click events.
    effortValueToPosition = {};
    effortUniqueCount = 0;

    effortRadios.forEach(function(radio) {
        if (!effortValueToPosition[radio.value]) {
            effortUniqueCount++;
            effortValueToPosition[radio.value] = effortUniqueCount;
        }
    });

    console.log(
        "Effort: found " + effortRadios.length +
        " radios, " + effortUniqueCount + " unique choices"
    );

    effortRadios.forEach(function(radio) {
        radio.addEventListener('click', function() {
            window._effortValue = effortValueToPosition[radio.value];
            console.log(
                "Effort clicked: radio value=" + radio.value +
                " → scale value=" + window._effortValue
            );
        });
    });
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});

Qualtrics.SurveyEngine.addOnPageSubmit(function() {
    var idx = Qualtrics.SurveyEngine.getEmbeddedData('LastCompletedTaskIndex');

    if (!idx) {
        idx = Qualtrics.SurveyEngine.getEmbeddedData('CurrentTaskIndex');
    }

    var effortValue = window._effortValue;

    if (effortValue == null && effortContainer) {
        var checkedRadio = effortContainer.querySelector('input[type="radio"]:checked');

        if (checkedRadio && effortValueToPosition[checkedRadio.value]) {
            effortValue = effortValueToPosition[checkedRadio.value];
            console.log(
                "Effort recovered on submit: radio value=" + checkedRadio.value +
                " → scale value=" + effortValue
            );
        }
    }

    if (effortValue != null) {
        var embeddedDataName = 'Effort_' + idx;
        Qualtrics.SurveyEngine.setEmbeddedData(embeddedDataName, effortValue);
        console.log("Effort saved: " + embeddedDataName + " = " + effortValue);
    } else {
        console.warn("Effort value was not captured for Effort_" + idx);
    }

    var completedIndex = parseInt(idx, 10);

    if (!isNaN(completedIndex)) {
        var nextTaskIndex = completedIndex + 1;

        Qualtrics.SurveyEngine.setEmbeddedData('CurrentTaskIndex', String(nextTaskIndex));

        console.log(
            "CurrentTaskIndex set to " + nextTaskIndex +
            " based on LastCompletedTaskIndex = " + completedIndex
        );
    }
});
