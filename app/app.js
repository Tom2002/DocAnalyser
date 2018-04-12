var app = angular.module('myApp', ['ui.router']);

app.config(['$stateProvider', function ($stateProvider) {

    $stateProvider
        .state('analyze', {
            templateUrl: './app/components/analyze/analyze.html'
        })

        .state('chronicle', {
            templateUrl: './app/components/chronicle/chronicle.html'
        })

        .state('init', {
            url: '?a&h&url',
            controller: 'RequestCtrl',
        })

        .state('emptyKeywordsTopics', {
            url: '?query',
            views: {
                '': {
                    templateUrl: './app/components/errors/noData.html'
                },
                'emptyKeywordsTopics': {
                    templateUrl: './app/components/errors/emptyKeywordsTopics.html'
                }
            }

        })

        .state('timeout', {
            url: '?query=&error=network timeout',
            // url: '{query:.?}{error:network timeout}',
            views: {
                '': {
                    templateUrl: './app/components/errors/noData.html'
                },
                'timeout': {
                    templateUrl: './app/components/errors/timeout.html'
                }
            }
        })

        .state('exception', {
            url: '?query=&error=exception occurred',
            // url: '{query:.?}{error:exeption occurred}',
            views: {
                '': {
                    templateUrl: './app/components/errors/noData.html'
                },
                'exception': {
                    templateUrl: './app/components/errors/exception.html'
                }
            }
        });
}]);

/* Maybe later needed; requires ngRoute
app.run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
    var original = $location.path;
    $location.path = function (path, reload) {
        if (reload === false) {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }
        return original.apply($location, [path]);
    };
}]);*/

/** Begin Angular Services */

app.service('ConverterService', function () {

    /* convert array to Keywords/Topics Object */
    this.arrToObject = function (arr) {
        var rv = {};
        for (var i = 0, len = arr.length; i < len; ++i) {
            if (arr[i] !== undefined) {
                rv[arr[i]] = false;
            }
        }
        return rv;
    }
});

app.service('TopicsService', function () {
    this.topics = {};

    /** Functions */

    this.setTopics = function (topics) {
        this.topics = topics;
    };

    this.selectedTopics = function () {
        var selectedTopics = "";
        for (var topicName in this.topics) {
            if (this.topics[topicName]) {
                selectedTopics += topicName + " ";
            }
        }
        return selectedTopics;
    };

    this.getAll = function () {
        return Object.keys(this.topics);
    };

    this.changeStatus = function (topic) {
        this.topics[topic] = !this.topics[topic];
    };

    this.setStatus = function (topic, status) {
        this.topics[topic] = status;
    };

    /** End Functions */
});

app.service('KeywordsService', function () {
    this.keywords = {}; // all keywords
    this.topKeywords = []; // top 4 keywords

    /** Functions */
    this.setKeywords = function (keywords) {
        this.keywords = keywords;
    };

    this.selectedKeywords = function () {
        var selectedKeywords = "";
        for (var keywordName in this.keywords) {
            if (this.keywords[keywordName]) {
                selectedKeywords += keywordName + " ";
            }
        }
        return selectedKeywords;
    };

    this.selectedKeywordsAsArr = function () {
        var selectedKeywords = [];
        for (var keywordName in this.keywords) {
            if (this.keywords[keywordName]) {
                selectedKeywords.push(keywordName);
            }
        }
        return selectedKeywords;
    };

    this.getAll = function () {
        return Object.keys(this.keywords);
    };

    this.changeStatus = function (keyword) {
        this.keywords[keyword] = !this.keywords[keyword];
    };

    this.setStatus = function (keyword, status) {
        this.keywords[keyword] = status;
    };

    this.getTopKeywords = function () {
        return this.topKeywords;
    };

    this.setTopKeywords = function (topKeywords) {
        this.topKeywords = topKeywords;
    };

    /** End Functions */
});


/** End Angular Services */

/** Begin Angular Controllers */
app.controller('RequestCtrl', ['$scope', '$state', '$stateParams', '$location', 'KeywordsService', 'TopicsService',
    'LocalStorageService', 'ConverterService', function ($scope, $state, $stateParams, $location, KeywordsService,
                                                         TopicsService, LocalStorageService, ConverterService) {

        /** Functions */
        /* Get the request parameters from the url and place them as keywords and topics */
        $scope.processRequestParameter = function () {
            var keywords = [];
            var topics = [];
            var topKeywords = [];
            var keywordsObj = {};
            var topicsObj = {};
            var url = "";
            // fill table with keywords:
            keywords = $stateParams.a.split(";");
            // fill most important keywords:
            for (var i = 0; i < 4; i++) {
                topKeywords.push(keywords[i]);
            }
            KeywordsService.setTopKeywords(topKeywords);
            keywordsObj = ConverterService.arrToObject(keywords);
            KeywordsService.setKeywords(keywordsObj);
            // fill table with topics:
            topics = $stateParams.h.split(";");
            topicsObj = ConverterService.arrToObject(topics);
            TopicsService.setTopics(topicsObj);
            // preselect the top 4 keywords
            for (var i = 0; i < 4; i++) {
                keywordsObj[keywords[i]] = true;
            }
            // get the url of the analysed web file
            url = $stateParams.url;
            $location.url($location.path()); // remove request param from url
            // check if the user has activated the chronicle function
            LocalStorageService.loadChronicleStatus();
            if (LocalStorageService.getChronicleStatus() > 0) {
                $scope.populateLocalStorage(keywordsObj, topicsObj, url);
            }
            else {
                $scope.loadLocaleStorage();
            }
            $state.go('analyze');
        };

        $scope.loadLocaleStorage = function () {
            if (LocalStorageService.storageAvailable('localStorage')) {
                // LocalStorage is available
                LocalStorageService.loadQueries();
            }
            else {
                // LocalStorage is not available
                // TO DO: fancy error message to the user
                window.alert("Your Browser does not support local storage." +
                    "The chronicle view is therefore not available.");
            }
        };

        $scope.populateLocalStorage = function (keywords, topics, url) {
            if (LocalStorageService.storageAvailable('localStorage')) {
                // LocalStorage is available
                var currentDate = new Date();
                var newQuery = LocalStorageService.newQuery(currentDate, keywords, topics, url);
                LocalStorageService.loadQueries();
                LocalStorageService.addQuery(newQuery);
                LocalStorageService.saveQueries();
            }
            else {
                // LocalStorage is not available
                // TO DO: fancy error message to the user
                window.alert("Your Browser does not support local storage." +
                    "The chronicle view is therefore not available.");
            }

        };

        /** End Functions */
        $scope.processRequestParameter();

    }]);

app.controller('HelpCtrl', function ($scope) {
    $scope.showHelp = function () {
        $scope.popoverIsVisible = true;
    };

    $scope.hideHelp = function () {
        $scope.popoverIsVisible = false;
    };
});

app.controller('SideMenuCtrl', function ($scope) {

});

app.controller('DropdownMenuCtrl', ['$scope', '$state',
    function ($scope, $state) {
        $scope.changeView = function (destination) {
            $state.go(destination);
        }
    }]);

app.controller('KeywordsMenuCtrl', function ($scope, $rootScope, KeywordsService, TopicsService) {
    $scope.keywords = KeywordsService.keywords;
    $scope.keywordsService = KeywordsService.keywords;

    /* a query is loaded (from the Chronicle View) */
    $scope.$on('queryLoaded', function () {
        $rootScope.$broadcast('clearQueryInput', ""); // clear current search terms
        $scope.init(); // 'click' the top 4 Keywords => put them into the search bar
    });

    // user clicked a checkbox:
    $scope.clicked = function (keyword) {
        var status = KeywordsService.keywords[keyword];
        if (TopicsService.getAll().indexOf(keyword) > -1) { //selected keyword is also a topic
            TopicsService.setStatus(keyword, status);
            //window.alert("keyword = " + keyword + " status = " + status);
        }
        //notify SearchInputCtrl:
        $rootScope.$broadcast('selectedTermsChanged', {term: keyword, status: status});

    };

    /* initialization */
    $scope.init = function () {
        // The objects are already set to true, but if the keywords are topics at the same time,
        // they must also be manually clicked to transfer the object status of the keywords to the topics
        $scope.topKeywords = KeywordsService.getTopKeywords();
        for (var i = 0; i < 4; i++) {
            $scope.clicked($scope.topKeywords[i]);
        }
    };

    $scope.init();

});

app.controller('TopicsMenuCtrl', function ($scope, $rootScope, TopicsService, KeywordsService) {
    $scope.topics = TopicsService.topics;

    // user clicked a checkbox:
    $scope.clicked = function (topic) {
        var status = $scope.topics[topic];

        if (KeywordsService.getAll().indexOf(topic) > -1) { //selected topic is also a keyword
            KeywordsService.setStatus(topic, status);
            //window.alert("topic = " + topic + " status = " + status);
        }
        //notify SearchInputCtrl:
        $rootScope.$broadcast('selectedTermsChanged', {term: topic, status: status});
    }
});

app.controller('SearchInputCtrl', function ($scope, $location, TopicsService, KeywordsService) {
    $scope.topicsService = TopicsService;
    $scope.keywordsService = KeywordsService;
    $scope.queryInput = ""; // search bar
    $scope.queryInputArr = []; // search bar items as array
    $scope.selectedTerms = [];
    $scope.diff = [];

    /** Functions */

    $scope.symmetricDifference = function (a1, a2) {
        var result = [];
        for (var i = 0; i < a1.length; i++) {
            if (a2.indexOf(a1[i]) === -1 && result.indexOf(a1[i]) === -1) { // new difference found
                result.push(a1[i]);
            }
        }
        for (i = 0; i < a2.length; i++) {
            if (a1.indexOf(a2[i]) === -1 && result.indexOf(a2[i]) === -1) {
                result.push(a2[i]);
            }
        }
        return result;
    }
    /** End Functions */

    /** Angular Functions */

    /* clear the queryInput */
    $scope.$on('clearQueryInput', function () {
        $scope.queryInput = "";
    });

    /* a term was selected or deselected */
    $scope.$on('selectedTermsChanged', function (event, args) {
        var status = args.status; // true for selected; false for deselected
        var selectedTerm = args.term; // keyword or topic
        var queryLength = $scope.queryInput.length;
        var query = $scope.queryInput.split(/\s+/);
        if (queryLength === 0) {
            query.pop(); // remove first whitespace character
        }
        if (status) { // add term to search bar
            if (query.indexOf(selectedTerm) === -1) { // no duplicate terms
                query.push(selectedTerm);
            }
        }
        else { // remove every occurrence of the term from the search bar
            for (var i = queryLength - 1; i >= 0; i--) {
                if (query[i] === selectedTerm) {
                    query.splice(i, 1);
                }
            }
        }
        $scope.queryInput = query.join(" ");
    });

    /* terms were selected or deselected */
    $scope.$watchGroup(['keywordsService.selectedKeywords()', 'topicsService.selectedTopics()'], function (newValues) {
        setTimeout(function () {
            angular.element(document.querySelector('#customSearch')).click(); // execute google search
        }, 0);
        // newValues array contains the current values of the watch expressions
        $scope.selectedKeywords = newValues[0].split(" ");
        $scope.selectedTopics = newValues[1].split(" ");
        $scope.selectedTerms = $scope.selectedKeywords.concat($scope.selectedTopics);
        //window.alert("selectedTerms = " + $scope.selectedTerms.toString());
    });

    /*user manually change the queryInput */
    $scope.change = function () {
        $scope.queryInputArr = $scope.queryInput.split(" ");

        $scope.diff = $scope.symmetricDifference($scope.queryInputArr, $scope.selectedTerms);

        for (var i = 0; i < $scope.diff.length; i++) {
            // term must be keyword or topic
            if (KeywordsService.getAll().indexOf($scope.diff[i]) > -1) { // it is a keyword
                KeywordsService.changeStatus($scope.diff[i]);
            }
            if (TopicsService.getAll().indexOf($scope.diff[i]) > -1) { // it is a topic
                TopicsService.changeStatus($scope.diff[i]);
            }
        }
    };

    /** End Angular Functions */

});

//Does not do anything at the moment
app.controller('SearchResultsCtrl', function ($scope) {

});

// Does not work properly yet...
app.controller('ErrorCtrl', function ($scope, $state) {
    if ($state.is('emptyKeywordsTopics')) {
        $scope.hideResults = true;
    }

});

/** End Angular Controllers */

//Setup for the Custom Google Search

//Hook callback into the rendered Google Search
window.__gcse = {
    callback: googleCSELoaded
};

function googleCSELoaded() {
    // initial search after the page is loaded for the first time
    var searchText = $("#q").val();
    google.search.cse.element.render({
        gname: 'searchOnlyCSE',
        div: 'results',
        tag: 'searchresults-only',
        attributes: {linkTarget: ''}
    });
    var element = google.search.cse.element.getElement('searchOnlyCSE');
    element.execute(searchText);

    // triggers every following search
    $("#customSearch").click(function () {
        var searchText = $("#q").val();
        google.search.cse.element.render({
            gname: 'searchOnlyCSE',
            div: 'results',
            tag: 'searchresults-only',
            attributes: {linkTarget: ''}
        });
        var element = google.search.cse.element.getElement('searchOnlyCSE');
        element.execute(searchText);
    })
}

//Custom Google Search
(function () {
    var cx = '003813809171160788124:z54qpilp6j4';
    var gcse = document.createElement('script');
    gcse.type = 'text/javascript';
    gcse.async = true;
    gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(gcse, s);
})();