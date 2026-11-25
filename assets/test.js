/* Original vocabulary quiz. Reports observed answers only, never a CEFR estimate.
   Everything runs in memory in the browser. Nothing is sent or persisted. */
(function () {
  "use strict";

  var lang = window.SENTARI_SITE_LANG || document.documentElement.lang || "fr";
  var supported = ["fr", "en", "es", "it", "de"];
  if (supported.indexOf(lang) < 0) lang = "en";

  var words = [
    {word:"borrow",band:0,pos:"verb",meaning:{fr:"prendre temporairement ce qui appartient à quelqu’un",en:"take something temporarily with permission",es:"tomar temporalmente algo que pertenece a otra persona",it:"prendere temporaneamente qualcosa che appartiene a un’altra persona",de:"etwas mit Erlaubnis vorübergehend nehmen"}},
    {word:"quiet",band:0,pos:"adjective",meaning:{fr:"qui fait très peu de bruit",en:"making very little noise",es:"que hace muy poco ruido",it:"che fa pochissimo rumore",de:"mit sehr wenig Lärm"}},
    {word:"neighbor",band:0,pos:"noun",meaning:{fr:"personne qui habite près de chez vous",en:"a person who lives near you",es:"persona que vive cerca de ti",it:"persona che vive vicino a te",de:"eine Person, die in deiner Nähe wohnt"}},
    {word:"improve",band:1,pos:"verb",meaning:{fr:"rendre meilleur ou devenir meilleur",en:"make or become better",es:"hacer que algo mejore o volverse mejor",it:"rendere migliore o diventare migliore",de:"etwas verbessern oder besser werden"}},
    {word:"crowded",band:1,pos:"adjective",meaning:{fr:"rempli de nombreuses personnes",en:"filled with many people",es:"lleno de muchas personas",it:"pieno di molte persone",de:"voller Menschen"}},
    {word:"advice",band:1,pos:"noun",meaning:{fr:"avis donné pour guider une décision",en:"an opinion given to guide a decision",es:"opinión dada para orientar una decisión",it:"parere dato per orientare una decisione",de:"eine Empfehlung, die bei einer Entscheidung helfen soll"}},
    {word:"afford",band:2,pos:"verb",meaning:{fr:"avoir assez d’argent ou de temps pour quelque chose",en:"have enough money or time for something",es:"tener suficiente dinero o tiempo para algo",it:"avere abbastanza denaro o tempo per qualcosa",de:"genug Geld oder Zeit für etwas haben"}},
    {word:"reliable",band:2,pos:"adjective",meaning:{fr:"sur lequel on peut compter",en:"able to be trusted or depended on",es:"en quien o en que se puede confiar",it:"su cui si può fare affidamento",de:"vertrauenswürdig und verlässlich"}},
    {word:"outcome",band:2,pos:"noun",meaning:{fr:"résultat final d’une action ou d’un processus",en:"the final result of an action or process",es:"resultado final de una acción o proceso",it:"risultato finale di un’azione o di un processo",de:"das Endergebnis einer Handlung oder eines Vorgangs"}},
    {word:"undermine",band:3,pos:"verb",meaning:{fr:"affaiblir progressivement et souvent indirectement",en:"weaken gradually, often in an indirect way",es:"debilitar de forma gradual, a menudo indirectamente",it:"indebolire gradualmente, spesso in modo indiretto",de:"allmählich und oft indirekt schwächen"}},
    {word:"reluctant",band:3,pos:"adjective",meaning:{fr:"peu disposé à agir, hésitant",en:"unwilling or hesitant to act",es:"poco dispuesto a actuar, vacilante",it:"restio ad agire, esitante",de:"nicht bereit oder zögerlich zu handeln"}},
    {word:"insight",band:3,pos:"noun",meaning:{fr:"compréhension claire et profonde d’une situation",en:"a clear and deep understanding of a situation",es:"comprensión clara y profunda de una situación",it:"comprensione chiara e profonda di una situazione",de:"ein klares und tiefes Verständnis einer Situation"}},
    {word:"alleviate",band:4,pos:"verb",meaning:{fr:"rendre une douleur ou un problème moins grave",en:"make pain or a problem less severe",es:"hacer que un dolor o problema sea menos grave",it:"rendere meno grave un dolore o un problema",de:"Schmerzen oder ein Problem lindern"}},
    {word:"pervasive",band:4,pos:"adjective",meaning:{fr:"présent et diffusé dans presque toutes les parties",en:"present and spreading through almost every part",es:"presente y extendido por casi todas partes",it:"presente e diffuso in quasi ogni parte",de:"fast überall vorhanden und verbreitet"}},
    {word:"scrutiny",band:4,pos:"noun",meaning:{fr:"examen très attentif et critique",en:"very careful and critical examination",es:"examen muy atento y crítico",it:"esame molto attento e critico",de:"eine sehr genaue und kritische Prüfung"}},
    {word:"dissemble",band:5,pos:"verb",meaning:{fr:"cacher ses véritables intentions en simulant",en:"hide one’s true motives or feelings by pretending",es:"ocultar las verdaderas intenciones o emociones fingiendo",it:"nascondere intenzioni o sentimenti reali fingendo",de:"wahre Absichten oder Gefühle durch Verstellung verbergen"}},
    {word:"fastidious",band:5,pos:"adjective",meaning:{fr:"très exigeant sur les détails, difficile à satisfaire",en:"very demanding about details and hard to satisfy",es:"muy exigente con los detalles y difícil de satisfacer",it:"molto esigente sui dettagli e difficile da soddisfare",de:"bei Details äußerst anspruchsvoll und schwer zufriedenzustellen"}},
    {word:"conundrum",band:5,pos:"noun",meaning:{fr:"problème difficile et déroutant",en:"a difficult and confusing problem",es:"problema difícil y desconcertante",it:"problema difficile e sconcertante",de:"ein schwieriges und verwirrendes Problem"}}
  ];

  var ui = {
    fr:{progress:function(n){return "Question "+n+" sur 18";},pos:{verb:"verbe",adjective:"adjectif",noun:"nom"}},
    en:{progress:function(n){return "Question "+n+" of 18";},pos:{verb:"verb",adjective:"adjective",noun:"noun"}},
    es:{progress:function(n){return "Pregunta "+n+" de 18";},pos:{verb:"verbo",adjective:"adjetivo",noun:"sustantivo"}},
    it:{progress:function(n){return "Domanda "+n+" di 18";},pos:{verb:"verbo",adjective:"aggettivo",noun:"sostantivo"}},
    de:{progress:function(n){return "Frage "+n+" von 18";},pos:{verb:"Verb",adjective:"Adjektiv",noun:"Substantiv"}}
  }[lang];

  function shuffled(array) {
    var result = array.slice();
    for (var index = result.length - 1; index > 0; index -= 1) {
      var random = Math.floor(Math.random() * (index + 1));
      var swap = result[index]; result[index] = result[random]; result[random] = swap;
    }
    return result;
  }

  function optionsFor(item) {
    var samePart = words.filter(function (candidate) { return candidate.pos === item.pos && candidate.word !== item.word; });
    var nearest = samePart.sort(function (a, b) {
      var da = Math.abs(a.band - item.band), db = Math.abs(b.band - item.band);
      if (da !== db) return da - db;
      return a.word.localeCompare(b.word);
    }).slice(0, 3);
    return shuffled([item].concat(nearest));
  }

  var shell = document.getElementById("lexicalTest");
  if (shell) {
    var dialog = document.getElementById("diagnosticDialog");
    var views = shell.querySelectorAll("[data-test-view]");
    var progress = shell.querySelector("[data-test-progress]");
    var bar = shell.querySelector("[data-test-bar]");
    var partOfSpeech = shell.querySelector("[data-test-pos]");
    var word = shell.querySelector("[data-test-word]");
    var optionHost = shell.querySelector("[data-test-options]");
    var resultTitle = shell.querySelector("[data-test-result-title]");
    var resultBody = shell.querySelector("[data-test-result-body]");
    var answerReview = shell.querySelector("[data-answer-review]");
    var order = words.slice();
    var current = 0;
    var answers = [];

    function show(name) {
      views.forEach(function (view) { view.hidden = view.getAttribute("data-test-view") !== name; });
      shell.scrollTop = 0;
      if (dialog) dialog.scrollTop = 0;
    }
    function focusWithoutScrolling(element) {
      if (!element) return;
      element.tabIndex = -1;
      window.requestAnimationFrame(function () {
        shell.scrollTop = 0;
        element.focus({preventScroll:true});
      });
    }
    function begin() {
      order = [];
      for (var band = 0; band < 6; band += 1) {
        order = order.concat(shuffled(words.filter(function (item) { return item.band === band; })));
      }
      current = 0; answers = []; show("question"); renderQuestion();
      focusWithoutScrolling(word);
    }
    function renderQuestion() {
      var item = order[current];
      progress.textContent = ui.progress(current + 1);
      bar.style.width = (current / order.length * 100) + "%";
      partOfSpeech.textContent = ui.pos[item.pos];
      word.textContent = item.word;
      word.lang = "en";
      optionHost.innerHTML = "";
      optionsFor(item).forEach(function (candidate) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "test-option";
        button.textContent = candidate.meaning[lang];
        button.addEventListener("click", function () { answer(candidate.word === item.word, candidate.meaning[lang]); });
        optionHost.appendChild(button);
      });
    }
    function answer(correct, selected) {
      answers.push({item:order[current], correct:correct, selected:selected || null});
      current += 1;
      if (current >= order.length) finish(); else { renderQuestion(); focusWithoutScrolling(word); }
    }
    function finish() {
      var correct = answers.filter(function (a) { return a.correct; }).length;
      var text = {
        fr:[correct === 1 ? " réponse juste sur 18" : " réponses justes sur 18", "Voici les réponses de cette série. Pour aller plus loin, essayez d’employer quelques mots dans une phrase sans regarder leur définition.", "Bonne réponse", "À retravailler", "Votre choix\u202f: "],
        en:[correct === 1 ? " correct answer out of 18" : " correct answers out of 18", "Here are the answers to this set. Try using a few of the words in a sentence without looking at their definitions.", "Correct", "To practice", "Your choice: "],
        es:[correct === 1 ? " respuesta correcta de 18" : " respuestas correctas de 18", "Estas son las respuestas de la serie. Intenta usar algunas palabras en una frase sin mirar su definición.", "Correcta", "Para practicar", "Tu elección: "],
        it:[correct === 1 ? " risposta corretta su 18" : " risposte corrette su 18", "Ecco le risposte della serie. Prova a usare alcune parole in una frase senza guardare la definizione.", "Corretta", "Da esercitare", "La tua scelta: "],
        de:[" von 18 richtig", "Hier sind die Antworten dieser Reihe. Versuche, einige Wörter ohne Blick auf die Definition in einem Satz zu verwenden.", "Richtig", "Zum Üben", "Deine Wahl: "]
      }[lang];
      resultTitle.textContent = correct + text[0];
      resultBody.textContent = text[1];
      answerReview.replaceChildren();
      answers.forEach(function (answer) {
        var row = document.createElement("li");
        var status = document.createElement("span");
        status.className = answer.correct ? "correct" : "incorrect";
        status.textContent = answer.correct ? "✓" : "○";
        status.setAttribute("role", "img");
        status.setAttribute("aria-label", answer.correct ? text[2] : text[3]);
        var content = document.createElement("div");
        var label = document.createElement("b");
        label.textContent = answer.item.word;
        label.lang = "en";
        var meaning = document.createElement("p");
        meaning.textContent = answer.item.meaning[lang];
        content.append(label, meaning);
        if (!answer.correct && answer.selected) {
          var chosen = document.createElement("p");
          chosen.textContent = text[4] + answer.selected;
          content.appendChild(chosen);
        }
        row.append(status, content);
        answerReview.appendChild(row);
      });
      show("result");
      focusWithoutScrolling(resultTitle);
      bar.style.width = "100%";
    }
    shell.querySelector("[data-test-start]").addEventListener("click", begin);
    shell.querySelector("[data-test-restart]").addEventListener("click", begin);
    shell.querySelector("[data-test-unknown]").addEventListener("click", function () { answer(false); });
    if (dialog) dialog.addEventListener("close", function () { show("intro"); });
    document.documentElement.classList.add("js-quiz");
  }

})();
