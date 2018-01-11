var app = angular.module('myApp', []);
app.directive('ngEnter', function () { //a directive to 'enter key press' in elements with the "ng-enter" attribute

        return function (scope, element, attrs) {

            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    })
app.controller('myCtrl', function($scope) {
    app.factory("DataModel", function() {
      var Service = {};
      return Service;
    });
  $scope.chatMessages = [];
  $scope.chatReplyMessages = [];
  $scope.formatChat = function(icon,username,text,origDt) {
    var chat = {};
    chat.icon = icon;
    chat.username = username;
    chat.text = text;
    chat.origDt = origDt;
    return chat;
  }
  $scope.addChat = function() {
    if ($scope.newChatMsg != undefined && $scope.newChatMsg != "") {
        
      var chat = $scope.formatChat("./img/user_icon.png",
                           "Mahboob",
                           $scope.newChatMsg,
                           new Date());

      $scope.chatMessages.push(chat);
        
      if($scope.newChatMsg == "Hii" ||  $scope.newChatMsg == "Hello"){
          var chatReply = $scope.formatChat("./img/user_reply_icon.png",
                           "Nileema",
                           "Hello! How r u",
                           new Date());

      $scope.chatReplyMessages.push(chatReply);
      }else {
           chatReply = $scope.formatChat("./img/user_reply_icon.png",
                           "Nileema",
                           "Get your reply here",
                           new Date());

      $scope.chatReplyMessages.push(chatReply);
      }
    
      $scope.newChatMsg = "";
    }
    else {
        
        

    }
  }
  
  
    
});