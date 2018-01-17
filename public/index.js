$(function() {
    
    $(document).delegate(".chat-btn", "click", function() {
      var value = $(this).attr("chat-value");
      var name = $(this).html();
      $("#chat-input").attr("disabled", false);
      // generate_message(name, 'self');
    })
    
    $("#chat-circle").click(function() {    
      $("#chat-circle").toggle('scale');
      $('.avenue-messenger').height('75%');
      $(".chat-box").toggle('scale');
    })
    
    $("#end-chat, .chat-box-toggle").click(function() {
      $("#chat-circle").toggle('scale');
      $(".chat-box").toggle('scale');
      $('.menu .items span').toggleClass('active');
      $('.menu .button').toggleClass('active');
    });

    $("#minimize").click(function() {
      $('.avenue-messenger').height('10%');
      $('.menu .items span').toggleClass('active');
      $('.menu .button').toggleClass('active');
    });

    $(".chat").click(function() {
      $('.avenue-messenger').height('75%');
    });
});