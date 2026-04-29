/**
 * Qualtrics: paste this entire file into the same question’s **JavaScript** (gear icon),
 * alongside the HTML from videoQuestion.html.
 *
 * Local test: open videoTest.html (loads this script from the same folder).
 *
 * Uses addOnReady (not addOnload) so hideNextButton matches mainPageAdaptiv.js.
 */
(function () {
  function initVideoPlayback() {
    var v = document.getElementById("lesson");
    var btnPlay = document.getElementById("btnPlay");
    var continueWrap = document.getElementById("continueWrap");
    var btnContinue = document.getElementById("btnContinue");
    if (!v || !btnPlay) return;

    var maxSeen = 0;

    btnPlay.addEventListener("click", function () {
      v.play().catch(function () {});
      btnPlay.disabled = true;
    });

    v.addEventListener("timeupdate", function () {
      if (!v.seeking && v.currentTime > maxSeen) {
        maxSeen = v.currentTime;
      }
    });

    v.addEventListener("seeking", function () {
      if (v.currentTime > maxSeen + 0.25) {
        v.currentTime = maxSeen;
      }
    });

    v.addEventListener("ended", function () {
      if (typeof window.showQualtricsNextAfterVideo === "function") {
        window.showQualtricsNextAfterVideo();
        return;
      }
      if (continueWrap && btnContinue) {
        continueWrap.style.display = "block";
        btnContinue.disabled = false;
        btnContinue.focus();
      }
    });

    if (btnContinue) {
      btnContinue.addEventListener("click", function () {
        var next = document.getElementById("NextButton");
        if (next) next.click();
      });
    }
  }

  if (typeof Qualtrics !== "undefined" && Qualtrics.SurveyEngine) {
    Qualtrics.SurveyEngine.addOnReady(function () {
      var that = this;
      that.hideNextButton();
      window.showQualtricsNextAfterVideo = function () {
        that.showNextButton();
      };
      initVideoPlayback();
    });
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideoPlayback);
  } else {
    initVideoPlayback();
  }
})();
