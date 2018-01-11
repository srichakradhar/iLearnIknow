window.search = {
  "synonyms": [
    {
      "words": ["9k"],
      "synonyms": ["9000"]
    }
  ],
  "hardPhrases": ["segment routing"],
  "enrichQuery": function(query) {
    this.synonyms.forEach(function(synonymDefinition){
      synonymDefinition.words.forEach(function(word) {
        var regularExpression = new RegExp(word, "gi");
        query = query.replace(regularExpression, function(match){
          return "(" + match + " OR " + synonymDefinition.synonyms.join(" ORD ") + ")";
        });
      });
    });
    this.hardPhrases.forEach(function(phrase){
      var regularExpression = new RegExp(phrase, "gi");
      query = query.replace(regularExpression, function(match){
        return '"' + match + '"';
      });
    });
    console.log(query);
    return query;
  }
}

window.search.synonyms = [{"words":["1k"], "synonyms":["1000"]}, {"words":["2k"], "synonyms":["2000"]}, {"words":["3k"], "synonyms":["3000"]}, {"words":["4k"], "synonyms":["4000"]}, {"words":["5k"], "synonyms":["5000"]}, {"words":["6k"], "synonyms":["6000"]}, {"words":["7k"], "synonyms":["7000"]}, {"words":["8k"], "synonyms":["8000"]}, {"words":["9k"], "synonyms":["9000"]}];
window.search.hardPhrases = ["segment routing", "autonomic networking"];