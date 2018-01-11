function loadMetadataOptions(select, metadata, query) {
  query = query != null ? search.enrichQuery(query) : null;
  select.closest(".panel").find(".fa-refresh").addClass("fa-spin");
  select.attr("disabled", "disabled");
  url = "/v1/values/" + metadata + "?options=welcome_values&format=json&q=" + (query != null ? query : "");
  //Facets
  var currentlySelectedValues = {};
  var selectedPlatform = false;
  var selectedSolution = false;
  $(".panel-select").each(function(){
    var selectedValue = $(this).val();
    if(selectedValue!=null){
      var id = $(this).attr("id");
      //For the release list we only care about platform and (release) in the URL
      if(id=="platform" || id=="release" || select.attr("id")!="release") {
        if(id=="release") {
          url += ' (release:"' + encodeURI(selectedValue) + '" OR release:"All")';
        }
        else {
          url += ' ' + this.id + ':"' + encodeURI(selectedValue) + '"';
        }
      }
      currentlySelectedValues[this.id] = selectedValue;
      if(this.id == "platform") {
        selectedPlatform = true;
      }
      else if(this.id == "solution") {
        selectedSolution = true;
      }
    }
  });
  if(selectedPlatform) {
    $("#platform").closest(".col-sm-4").removeClass("col-sm-4").addClass("col-sm-3");
    $("#solution").closest(".col-sm-4").hide(1000);
    resizeFilterBoxes();
  }
  else if(selectedSolution) {
    $("#solution").closest(".col-sm-4").removeClass("col-sm-4").addClass("col-sm-3");
    $("#platform").closest(".col-sm-4").hide(1000);
    resizeFilterBoxes();
  }
  if(selectedPlatform) {
    $("#release, #technology, #document-type").closest(".col-sm-3").show(1000);
  }
  else if(selectedSolution) {
    $("#solution-version, #technology, #document-type").closest(".col-sm-3").show(1000);
  }
  else {
    $("#release, #solution-version, #technology, #document-type").closest(".col-sm-3").hide(1000);
    $("#platform, #solution").closest(".col-sm-3").removeClass("col-sm-3").addClass("col-sm-4");
    //$("#platform, #solution").closest(".col-sm-3").show(1000);
    $("#platform, #solution").closest(".col-sm-4").show(1000, function(){
      resizeFilterBoxes();
    });
  }
  $.ajax({
      "url": url
  })
  .done(function (data) {
    select.empty();
    var distinctValues = data["values-response"]["distinct-value"];
    if(select[0].id=="release") {
      distinctValues = distinctValues.sort(function(a,b){
        if(a["_value"] > b["_value"]) return -1;
        if(a["_value"] < b["_value"]) return 1;
        return 0;
      });
    }
    var values = [];
    if(distinctValues != null){
      var selectedFound = false;
      distinctValues.forEach(function(distinctValue){
        if(currentlySelectedValues[select.attr("id")]==distinctValue["_value"]) {
          selectedFound = true;
          values.push(distinctValue["_value"]);
          var option = $('<option></option>').attr("value", distinctValue["_value"]).text(distinctValue["_value"]).attr("title", distinctValue["_value"]).attr("selected", "selected");
          select.append(option);
        }
      });
      if(selectedFound) {

      }
      else {
        distinctValues.forEach(function(distinctValue){
          if(distinctValue["_value"] != "All") {
            values.push(distinctValue["_value"]);
            var option = $('<option></option>').attr("value", distinctValue["_value"]).text(distinctValue["_value"]).attr("title", distinctValue["_value"]);
            if(currentlySelectedValues[select.attr("id")]==distinctValue["_value"]) {
              option.attr("selected", "selected");
            }
            select.append(option);
          }
        });
      }
    }
    else {
      select.append('<option disabled="disabled"></option>');
    }
    select.data("current-values", values);
    var numberOfOptions = values.length;
    if(numberOfOptions > 10) {
      select.removeClass("hidden-scrollbar"); //This only works in Webkit browsers but is a nice addition.
    }
    else {
      select.addClass("hidden-scrollbar"); //This only works in Webkit browsers but is a nice addition.
    }
    select.closest(".panel").find(".fa-refresh").removeClass("fa-spin");
    select.removeAttr("disabled");
    //Reapply any filter
    select.closest(".panel").find("input").trigger("input");
  });
}

function redrawLinks() {
  //var imageWidth = 1920;
  //var imageHeight = 777;
  //var imageHeight = 310;
  //var imageHeight = 310;

  var imageWidth = 2560;
  var imageHeight = 763;

  var containerWidth = $("#intro-links").width();
  var containerHeight = containerWidth/imageWidth*imageHeight;
  $("#intro-links").height(containerHeight);
  $("#intro-links h1").css({"top": containerHeight * 0.0325, "left": containerWidth * 0.0375, "font-size": (containerHeight * 0.1) + "px"});
  $("#intro-text").css({"top": containerHeight * 0.155, "left": containerWidth * 0.0375, "font-size": (containerHeight * 0.0425) + "px", "width": containerWidth * 0.46});
  var offsetFractions = [[0.575,0.1],[0.525,0.25],[0.625,0.4],[0.65,0.57],[0.525,0.75]]; //position of feature hotspots on the banner image
  $(".intro-link").each(function(index){
    $(this).css({"top": containerHeight * offsetFractions[index][0], "left": containerWidth * offsetFractions[index][1], "font-size": (containerHeight * 0.045) + "px"});
  });

  //Also resize the logo image
  var logoImageWidth = 669;
  var logoImageHeight = 352;
  var newWidth = parseInt($(".container").css("margin-left"));
  var newHeight = newWidth/logoImageWidth*logoImageHeight;
  if(newHeight > 30) {
    newHeight = 30;
    newWidth = newHeight/logoImageHeight*logoImageWidth;
  }
  var newMarginTop = (50 - newHeight) / 2;
  $("#logo-image").css({"width": newWidth, "height": newHeight, "margin-top": newMarginTop});
}

function resizeFilterBoxes() {
  $("input[placeholder='Filter the options below...']").each(function(){
    var thisInput = $(this);
    var parentWidth = thisInput.closest(".panel-heading").width();
    thisInput.width(parentWidth-105);
  });
}

$(function () {
  //Add the current user
  $.ajax({
      "url": "/get-current-user.sjs"
  })
  .done(function (data) {
      $("#userName").html(data.name);

      //Erroring - this can be logged in the backend
      /*$.ajax({
          "url": "/use_auth.sjs"
      })
      .done(function (userdata) {
        // Log the user privilege
        userdata = JSON.parse(userdata);
        var usertype = "";
        if (userdata.admin) { usertype="admin" }
        else if (userdata.registered) { usertype="registered" }
        else { usertype="guest" }
        $.ajax({
          "url": "/create_user_action.sjs",
          "type": "PUT",
          "data": JSON.stringify({
              "action": "userPrivilege",
              "userType": usertype
          })
        }).done(function (data) { });
      });*/
  });


  $(".panel-select").each(function() {
    loadMetadataOptions($(this), this.id);
  });

  $("#query").on("input", function() {
    var value = $(this).val();
    value = value==null ? "" : value;
    if(value=="") {
      $(".panel-select").each(function() {
        loadMetadataOptions($(this), this.id);
      });
    }
    else if(value.length>=3) {
      value = value.replace(/how |do |i |[^a-zA-Z0-9 ]/gi, "");
      $(".panel-select").each(function() {
        loadMetadataOptions($(this), this.id, value);
      });
    }
  });

  $(".panel-select").change(function() {
    var value = $("#query").val();
    value = value==null ? "" : value;
    if(value=="") {
      $(".panel-select").each(function() {
        loadMetadataOptions($(this), this.id);
      });
    }
    else {
      $(".panel-select").each(function() {
        loadMetadataOptions($(this), this.id, value);
      });
    }
  });

  $(".panel-select").closest(".panel").find("a").click(function(event){
    var filterInput = $(this).closest(".panel").find("input");
    filterInput.val("");
    var select = $(this).closest(".panel").find(".panel-select");
    var id = select.attr("id");
    if(id == "platform" || id == "solution") { //Clear everything
      $(".panel-select").val(null);
    }
    else {
      select.val(null);
    }
    select.change();
    event.preventDefault();
  });

  $(".panel-select").closest(".panel").find("input").on("input", function() {
    var text = $(this).val();
    var select = $(this).closest(".panel").find(".panel-select");
    var selectedValue = select.val();
    select.empty();
    if(text=="" || text==null) {
      select.data("current-values").forEach(function(value){
        var option = $('<option></option>').attr("value", value).text(value).attr("title", value);
        if(value==selectedValue) {
          option.attr("selected", "selected");
        }
        select.append(option);
      });
    }
    else {
      select.data("current-values").forEach(function(value){
        if(value.toLowerCase().indexOf(text.toLowerCase()) > -1) {
          var option = $('<option></option>').attr("value", value).text(value).attr("title", value);
          if(value==selectedValue) {
            option.attr("selected", "selected");
          }
          select.append(option);
        }
      });
    }
  });

  $("#search-form").submit(function(event){
    var query = $("#query").val();
	//Deepti: Stores search inputbox value  
	var inputVal = document.getElementById("query");
	//$("#loading-modal").modal("show");
    if(query==null || query=="") {
      event.preventDefault();
	//Deepti: Highlight the search inputbox for the empty search string submission
	  inputVal.style.backgroundColor="#FFFF99";
      var selectedOptions = [];
      $(".panel-select").each(function(){
        var selectedValue = $(this).val();
        if(selectedValue!=null){
		  inputVal.style.backgroundColor="white"; //prevent higlighting the search inputbox
          selectedOptions.push({
            "name": this.id,
            "value": selectedValue
          });
        }
      });
      if(selectedOptions.length==1){
        if(selectedOptions[0].name=="platform") {
          window.location.href = "platform_home.sjs?platform=" + selectedOptions[0].value;
        }
      }
      if(selectedOptions.length==2){
        if(selectedOptions[0].name=="platform" && selectedOptions[1].name=="release") {
          window.location.href = "platform_home.sjs?platform=" + selectedOptions[0].value + "&release=" + selectedOptions[1].value;
        }
      }
      var selections = selectedOptions.filter(function(selectedOption){
        return selectedOption.name == "platform" || selectedOption.name == "document-type" ||  selectedOption.name == "technology";
      });
      if(selections.length > 1 && selectedOptions[0].name=="platform") {
        window.location.href = "first_chapter.sjs?" + selectedOptions.map(function(selectedOption){
          return selectedOption.name + "=" + selectedOption.value;
        }).join("&");
      }
    }
  });

  $(window).resize(function() {
    redrawLinks();
  });
  redrawLinks();
  $('.intro-link').each(function(){
    var title = $(this).find(".intro-link-title").text();
    var contentDiv = $(this).find(".intro-link-content");
    var content = contentDiv.html();
    contentDiv.remove();
    $(this).find('[data-toggle="popover"]').popover({
      "title": title,
      "content": content,
      "html": true
    }).on("shown.bs.popover", function() {
	/*       $(this.nextSibling).find("button").click(function(event) {
        $("#video-modal").modal("show");
        $("#video-modal video").get(0).play();
      }); */
	  
	// Loads videos for each feature on Welcome Page banner image. (added by Deepti)
	$(this.nextSibling).find("button").click(function(event) {
        var videoSource = $(this).data("video");
        $("#video-modal").find("source").attr("src", videoSource);
        $("#video-modal video").get(0).load();
        $("#video-modal").modal("show");
        $("#video-modal video").get(0).play();
      });
	  
    }).on("hidden.bs.popover", function() {
      $(this).find(".fa-plus-circle").removeClass("fa-plus-circle").addClass("fa-check-circle");
    });
  });

  $("#video-modal").on("hidden.bs.modal", function () {
    $("#video-modal video").get(0).pause();
  });

  $(".intro-link a").hover(function(){
    $(this).find(".fa-plus-circle").addClass("fa-spin");
  }, function(){
    $(this).find(".fa-plus-circle").removeClass("fa-spin");
  });

  //Show the links
  $("#intro-links").css({"visibility": "visible"});

  //Resize the filter boxes
  $(window).resize(function() {
    resizeFilterBoxes();
  });
  resizeFilterBoxes();

});
