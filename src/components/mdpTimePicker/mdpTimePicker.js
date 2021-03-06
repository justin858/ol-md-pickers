/* global moment, angular */

function TimePickerCtrl($scope, $mdDialog, time, autoSwitch, $mdMedia) {
	var self = this;
    this.VIEW_HOURS = 1;
    this.VIEW_MINUTES = 2;
    this.currentView = this.VIEW_HOURS;
    this.time = moment(time);
    this.autoSwitch = !!autoSwitch;
    
    this.clockHours = parseInt(this.time.format("h"));
    this.clockMinutes = parseInt(this.time.minutes());
    
	$scope.$mdMedia = $mdMedia;
	
	this.switchView = function() {
	    self.currentView = self.currentView == self.VIEW_HOURS ? self.VIEW_MINUTES : self.VIEW_HOURS;
	};
    
	this.setAM = function() {
        if(self.time.hours() >= 12)
            self.time.hour(self.time.hour() - 12);
	};
    
    this.setPM = function() {
        if(self.time.hours() < 12)
            self.time.hour(self.time.hour() + 12);
	};
    
    this.cancel = function() {
        $mdDialog.cancel();
    };

    this.confirm = function() {
        $mdDialog.hide(this.time.toDate());
    };
}

function ClockCtrl($scope) {
    var TYPE_HOURS = "hours";
    var TYPE_MINUTES = "minutes";
    var self = this;
    
    this.STEP_DEG = 360 / 12;
    this.steps = [];
    
    this.CLOCK_TYPES = {
        "hours": {
            range: 12,
        },
        "minutes": {
            range: 60,
        }
    };
    
    this.getPointerStyle = function() {
        var divider = 1;
        switch(self.type) {
            case TYPE_HOURS:
                divider = 12;
                break;
            case TYPE_MINUTES:
                divider = 60;
                break;
        }  
        var degrees = Math.round(self.selected * (360 / divider)) - 180;
        return { 
            "-webkit-transform": "rotate(" + degrees + "deg)",
            "-ms-transform": "rotate(" + degrees + "deg)",
            "transform": "rotate(" + degrees + "deg)"
        };
    };
    
    this.setTimeByDeg = function(deg) {
        deg = deg >= 360 ? 0 : deg;
        var divider = 0;
        switch(self.type) {
            case TYPE_HOURS:
                divider = 12;
                break;
            case TYPE_MINUTES:
                divider = 60;
                break;
        }  
        
        self.setTime(
            Math.round(divider / 360 * deg)
        );
    };
    
    this.setTime = function(time, type) {
        this.selected = time;
        
        switch(self.type) {
            case TYPE_HOURS:
                if(self.time.format("A") == "PM") time += 12;
                this.time.hours(time);
                break;
            case TYPE_MINUTES:
                if(time > 59) time -= 60;
                this.time.minutes(time);
                break;
        }
        
    };
    
    this.init = function() {
        self.type = self.type || "hours";
        switch(self.type) {
            case TYPE_HOURS:
                for(var i = 1; i <= 12; i++)
                    self.steps.push(i);
                self.selected = self.time.hours() || 0;
                if(self.selected > 12) self.selected -= 12;
                    
                break;
            case TYPE_MINUTES:
                for(var i = 5; i <= 55; i+=5)
                    self.steps.push(i);
                self.steps.push(0);
                self.selected = self.time.minutes() || 0;
                
                break;
        }
    };
    
    this.init();
}

module.directive("mdpClock", ["$animate", "$timeout", function($animate, $timeout) {
    return {
        restrict: 'E',
        bindToController: {
            'type': '@?',
            'time': '=',
            'autoSwitch': '=?'
        },
        replace: true,
        template: '<div class="mdp-clock">' +
                        '<div class="mdp-clock-container">' +
                            '<md-toolbar class="mdp-clock-center md-primary"></md-toolbar>' +
                            '<md-toolbar ng-style="clock.getPointerStyle()" class="mdp-pointer md-primary">' +
                                '<span class="mdp-clock-selected md-button md-raised md-primary"></span>' +
                            '</md-toolbar>' +
                            '<md-button ng-class="{ \'md-primary\': clock.selected == step }" class="md-icon-button md-raised mdp-clock-deg{{ ::(clock.STEP_DEG * ($index + 1)) }}" ng-repeat="step in clock.steps" ng-click="clock.setTime(step)">{{ step }}</md-button>' +
                        '</div>' +
                    '</div>',
        controller: ["$scope", ClockCtrl],
        controllerAs: "clock",
        link: function(scope, element, attrs, ctrl) {
            var pointer = angular.element(element[0].querySelector(".mdp-pointer")),
                timepickerCtrl = scope.$parent.timepicker;
            
            var onEvent = function(event) {
                var containerCoords = event.currentTarget.getClientRects()[0];
                var x = ((event.currentTarget.offsetWidth / 2) - (event.pageX - containerCoords.left)),
                    y = ((event.pageY - containerCoords.top) - (event.currentTarget.offsetHeight / 2));

                var deg = Math.round((Math.atan2(x, y) * (180 / Math.PI)));
                $timeout(function() {
                    ctrl.setTimeByDeg(deg + 180);
                    if(ctrl.autoSwitch && ["mouseup", "click"].indexOf(event.type) !== -1 && timepickerCtrl) timepickerCtrl.switchView();
                });
            }; 
            
            element.on("mousedown", function() {
               element.on("mousemove", onEvent);
            });
            
            element.on("mouseup", function(e) {
                element.off("mousemove", onEvent);
            });
            
            element.on("click", onEvent);
            scope.$on("$destroy", function() {
                element.off("click", onEvent);
                element.off("mousemove", onEvent); 
            });
        }
    };
}]);

module.provider("$mdpTimePicker", function() {
    var LABEL_OK = "OK",
        LABEL_CANCEL = "Cancel";
        
    this.setOKButtonLabel = function(label) {
        LABEL_OK = label;
    };
    
    this.setCancelButtonLabel = function(label) {
        LABEL_CANCEL = label;
    };
    
    this.$get = ["$mdDialog", function($mdDialog) {
        var timePicker = function(time, options) {
            if(!angular.isDate(time)) time = Date.now();
            if (!angular.isObject(options)) options = {};
    
            return $mdDialog.show({
                controller:  ['$scope', '$mdDialog', 'time', 'autoSwitch', '$mdMedia', TimePickerCtrl],
                controllerAs: 'timepicker',
                clickOutsideToClose: true,
                template: '<md-dialog aria-label="" class="mdp-timepicker" ng-class="{ \'portrait\': !$mdMedia(\'gt-xs\') }">' +
                            '<md-dialog-content layout-gt-xs="row" layout-wrap>' +
                                '<md-toolbar layout-gt-xs="column" layout-xs="row" layout-align="center center" flex class="mdp-timepicker-time md-hue-1 md-primary">' +
                                    '<div class="mdp-timepicker-selected-time">' +
                                        '<span ng-class="{ \'active\': timepicker.currentView == timepicker.VIEW_HOURS }" ng-click="timepicker.currentView = timepicker.VIEW_HOURS">{{ timepicker.time.format("h") }}</span>:' + 
                                        '<span ng-class="{ \'active\': timepicker.currentView == timepicker.VIEW_MINUTES }" ng-click="timepicker.currentView = timepicker.VIEW_MINUTES">{{ timepicker.time.format("mm") }}</span>' +
                                    '</div>' +
                                    '<div layout="column" class="mdp-timepicker-selected-ampm">' + 
                                        '<span ng-click="timepicker.setAM()" ng-class="{ \'active\': timepicker.time.hours() < 12 }">AM</span>' +
                                        '<span ng-click="timepicker.setPM()" ng-class="{ \'active\': timepicker.time.hours() >= 12 }">PM</span>' +
                                    '</div>' + 
                                '</md-toolbar>' +
                                '<div>' +
                                    '<div class="mdp-clock-switch-container" ng-switch="timepicker.currentView" layout layout-align="center center">' +
	                                    '<mdp-clock class="mdp-animation-zoom" auto-switch="timepicker.autoSwitch" time="timepicker.time" type="hours" ng-switch-when="1"></mdp-clock>' +
	                                    '<mdp-clock class="mdp-animation-zoom" auto-switch="timepicker.autoSwitch" time="timepicker.time" type="minutes" ng-switch-when="2"></mdp-clock>' +
                                    '</div>' +
                                    
                                    '<md-dialog-actions layout="row">' +
	                                	'<span flex></span>' +
                                        '<md-button ng-click="timepicker.cancel()" aria-label="' + LABEL_CANCEL + '">' + LABEL_CANCEL + '</md-button>' +
                                        '<md-button ng-click="timepicker.confirm()" class="md-primary" aria-label="' + LABEL_OK + '">' + LABEL_OK + '</md-button>' +
                                    '</md-dialog-actions>' +
                                '</div>' +
                            '</md-dialog-content>' +
                        '</md-dialog>',
                targetEvent: options.targetEvent,
                locals: {
                    time: time,
                    autoSwitch: options.autoSwitch
                },
                skipHide: true
            });
        };
    
        return timePicker;
    }];
});

module.directive("mdpTimePicker", ["$mdpTimePicker", "$timeout", function($mdpTimePicker, $timeout) {
    return  {
        restrict: 'E',
        require: 'ngModel',
        transclude: true,
        templateUrl: 'components/mdpTimePicker/pickerTemplate.html',
        scope: {
            "minTime": "=min",
            "maxTime": "=max",
            "timeFormat": "@mdpFormat",
            "placeholder": "@mdpPlaceholder",
            "autoSwitch": "=?mdpAutoSwitch",
            "showIcon": "=",
            "required": '='
        },
        link: function(scope, element, attrs, ngModel, $transclude) {
            var inputElement = angular.element(element[0].querySelector('input')),
                inputContainer = angular.element(element[0].querySelector('md-input-container')),
                inputContainerCtrl = inputContainer.controller("mdInputContainer");
                
            $transclude(function(clone) {
               inputContainer.append(clone); 
            });
            
            var messages = angular.element(inputContainer[0].querySelector("[ng-messages]"));
            scope.iconShowing = scope.showIcon && scope.showIcon === 'true';
            scope.type = scope.timeFormat ? "text" : "time";
            scope.timeFormat = scope.timeFormat || "hh:mm A";
            scope.placeholder = scope.placeholder || scope.timeFormat;
            scope.autoSwitch = scope.autoSwitch || false;
            scope.showing = false;
            scope.controller = ngModel;
            messages.removeClass("md-auto-hide");
            
            ngModel.$validators.format = function(modelValue, viewValue) {
                return !viewValue || angular.isDate(viewValue) || moment(viewValue, scope.timeFormat, true).isValid();
            };
            
            ngModel.$validators.required = function(modelValue, viewValue) {
                return !scope.required || !!viewValue;
            };
            
            ngModel.$validators.min = function(modelValue, viewValue) {
                var modelTime = moment(modelValue);
                var minTime = moment(scope.minTime);
                return !modelValue || !scope.minTime || modelTime.isAfter(minTime);
            };
            
            ngModel.$validators.max = function(modelValue, viewValue) {
                var modelTime = moment(modelValue);
                var maxTime = moment(scope.maxTime);
                return !modelValue || !scope.maxTime || modelTime.isBefore(maxTime);
            };
        
            inputElement.on("input blur", function(event) {
                if (!scope.showing) {
                    ngModel.$setViewValue(event.target.value);
                }
            });
            
            scope.$watch('controller.$valid', function() {
                updateContainerValidity();
            });
            
            scope.$watchGroup(['minTime', 'maxTime'], function() {
                 validate();
            });
            
            scope.$watch(function(){ return ngModel.$modelValue; }, function() {
                 validate();  
            });
             
            scope.showPicker = function(ev) {
                scope.showing = true;
                $mdpTimePicker(ngModel.$modelValue || scope.minTime, {
            	    targetEvent: ev,
                    autoSwitch: scope.autoSwitch
        	    })
                .then(updateTime)
                .finally(allowUpdates); 
            };
            
            ngModel.$parsers.unshift(function(viewValue) {
                return parseTime(viewValue);
            });
            
            ngModel.$formatters.unshift(function(modelValue) {
                return moment(modelValue).format(scope.timeFormat);
            });
            
            ngModel.$render = function() {
                if (ngModel.$viewValue) {
                	inputElement.val(ngModel.$viewValue);
                	inputContainerCtrl.setHasValue(ngModel.$isEmpty());
            	}
            };
            
            function validate() {
                ngModel.$validate();
                updateContainerValidity();    
            }
            
            function updateContainerValidity() {
                if (!!Object.keys(ngModel.$error).length) {
                    inputContainerCtrl.setInvalid(true);
                } else {
                    inputContainerCtrl.setInvalid(false);
                }
            }
            
            function allowUpdates() {
                scope.showing = false;   
            }
            
            function parseTime(viewValue) {
                var parsed = moment(viewValue, scope.timeFormat, true);
                if(parsed.isValid()) {
                    var model = ngModel.$modelValue;
                    if (model) {
                        parsed.set({
                            'year': model.getFullYear(),
                            'month': model.getMonth(),
                            'date': model.getDate()
                        });
                    }
                    return parsed.toDate();
                } else {
                    return '';
                }
            }
                                
            function updateTime(date) {
                if (date && angular.isDate(date) && !moment(date).isSame(ngModel.$modelValue)) {
                    inputElement.value = moment(date).format(scope.timeFormat);
                    ngModel.$setViewValue(moment(date).format(scope.timeFormat));
                    ngModel.$render();
                }
            }
            
            scope.$on("$destroy", function() {
            });
        }
    };
}]);
