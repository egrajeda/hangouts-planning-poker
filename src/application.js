var app = angular.module('app', ['ngAnimate']);

function setValue(key, value) {
  console.debug("setValue", key, value);
  gapi.hangout.data.setValue(key, JSON.stringify(value));
}

function getValue(key) {
  var value = null;
  try {
    value = JSON.parse(gapi.hangout.data.getValue(key));
  } catch (e) { }
  console.debug("getValue", key, value);

  return value;
}

function clearValue(key) {
  console.debug("clearValue", key);
  gapi.hangout.data.clearValue(key);
}

function removeParticipant(participantId) {
  console.debug("removeParticipant", participantId);

  var participants = getValue('participants') || {};
  delete participants[participantId];
  setValue('participants', participants);

  clearValue(participantId + '_selection');
}

function synchronize($scope) {
  if (!gapi.hangout.isApiReady()) {
    return false;
  }

  console.debug("synchronize");

  if (!$scope.user) {
    $scope.user = gapi.hangout.getLocalParticipant().person;
  }
  $scope.participants = getValue('participants') || {};

  var sum = 0;
  var completed = true;
  for (var id in $scope.participants) {
    var selection = getValue(id + '_selection');
    if (!selection) {
      completed = false;
    }
    if (id === $scope.user.id && selection) {
      $scope.selection = selection;
      $scope.submitted = true;
    // Only clear my selection when I have submitted it, if not another user
    // will clear it after he submits his.
    } else if (id === $scope.user.id && !selection && $scope.submitted) {
      $scope.clear();
    }

    sum += parseInt(selection);

    $scope.participants[id].selection = selection;
  }

  var participantsCount = Object.keys($scope.participants).length;
  if (participantsCount > 0) {
    $scope.average = sum / participantsCount;

    var decimals = $scope.average % 1;
    if (decimals === 0) {
      $scope.average += "h";
    } else {
      $scope.average = parseInt($scope.average) + "h " +
        Math.round(decimals * 60) + "m";
    }
  } else {
    completed = false;
  }

  $scope.completed = completed;

  return true;
}

app.controller('MainCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
  $scope.participants = [];

  $timeout(function() {
    console.log("Attempting to synchronize with Hangout...");
    synchronize($scope);
  }, 1000);

  $scope.join = function() {
    if (!$scope.user) {
      console.debug("Attempted to join, but user is not set.");
      return;
    }

    var participants = getValue('participants') || {};
    participants[$scope.user.id] = {
      'id': $scope.user.id,
      'name': $scope.user.displayName,
      'image': $scope.user.image.url,
    };
    setValue('participants', participants);

    $scope.player = true;
  };

  $scope.leave = function() {
    if (!$scope.user) {
      console.debug("Attempted to leave, but user is not set.");
      return;
    }

    removeParticipant($scope.user.id);

    $scope.player = false;
    $scope.clear();
  };

  $scope.select = function(number) {
    if ($scope.player && !$scope.submitted) {
      $scope.selection = number;
    }
  };

  $scope.submit = function() {
    if ($scope.selection) {
      $scope.submitted = true;
      setValue($scope.user.id + '_selection', $scope.selection.toString());
    }
  };

  $scope.clear = function() {
    delete $scope.selection;
    $scope.submitted = false;
    clearValue($scope.user.id + '_selection');
  };

  $scope.reload = function() {
    var participants = getValue('participants') || {};
    for (var id in participants) {
      clearValue(id + '_selection');
    }
  };

  $scope.isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
  };

  gapi.hangout.onParticipantsDisabled.add(function(eventObj) {
    $scope.$apply(function() {
      console.debug("onParticipantsDisabled", eventObj);
      for (var index in eventObj.disabledParticipants) {
        removeParticipant(eventObj.disabledParticipants[index].person.id);
      }
    });
  });

  gapi.hangout.data.onStateChanged.add(function(eventObj) {
    $scope.$apply(function() {
      synchronize($scope);
    });
  });
}]);
