// copyright (c) 2014 DRI 

// these are similar to "global" in node.js
if (!window.hasOwnProperty('exports')) {
    window.exports = {};
}
if (!config) { 
    var config = {};
}

if (!debuglevel) { // printdiv
    var debuglevel = 0; // local side printdivs are enabled
}



function loadconfig() {

    var configuration = {};   
    // what environment and what defaults should be used
    configuration.environment = 'local';
    configuration.syncrule = 'sync_local_server';
    configuration.machinename = 'browser'; //'phonegap';
    configuration.startwid = 'startwid';
    configuration.collection = 'dricollection';
    configuration.db = 'data';
    configuration.datastore = 'localstorage';
    configuration.keycollection = configuration.collection+'key';
    configuration.databasetable = 'dricluster';
    
    configuration.sitename = 'dripoint';

    // configuration.e is the wid name for "environment"
    configuration.e = configuration.databasetable+configuration.collection+"environment";

    // configuration.d are the defaults that should be copied into command.environment during each execute
    configuration.d = {};
    configuration.d.default = {};
    configuration.d.default.collection = configuration.collection;
    configuration.d.default.db = configuration.db;
    configuration.d.default.datastore =  configuration.datastore;
    configuration.d.default.keycollection = configuration.keycollection;
    configuration.d.default.databasetable = configuration.databasetable;
    configuration.d.default.executetype = "series";

    configuration.d.global = {};
    configuration.d.var = {};
    configuration.d.platform = configuration.environment;
    configuration.d.syncrule = configuration.syncrule;
    configuration.d.defaultoutputcollection = "defaultoutputcollection";

    configuration.d.run = {};
    configuration.d.run.executelevel=0;

    // items at default level get copied at run time to command level
    // items at d level get copied to command.environment at run time
    // run time parameters win

    configuration.defaultenvironment = {};
    configuration.defaultenvironment[configuration.db] = configuration.d;

    configuration.delete = {};
    configuration.delete.collection = 'deletecollection';
    configuration.delete.db = 'data';
    configuration.delete.datastore = 'localstorage';
    configuration.delete.keycollection = configuration.collection+'key';
    configuration.delete.databasetable = 'dricluster';

    return {
        "configuration": configuration
    };
}


// these run on first loading file
config = loadconfig(); //;to config.js
//config.setdefaultparm = setdefaultparm; // sets a variable to hold the function so eventdeviceready can call it

// get from queue
// add to command.piggyback (result.execute or command.execute.machine or queue
// call server
// remove from queue
// look for incoming command.piggyback
// 
exports.execute_server = window.execute_server = execute_server = function execute_server(params, callback) {
    proxyprinttodiv('Function server TO ------', params, 99, true);

    var tempenvironment = params.command.environment; // for params.server can be delete in future

    // moved to server.js
    // delete params.command.processfn;
    // params.command.environment.run.executelevel=0;
    // params.command.environment.syncrule = "create_what_to_do_list";
    // delete params.command.environment;


    // below only for testing server locally --- ok to delete
    if (params.serverfn) 
    {
        params.command.xrun = params.serverfn;
        delete params.serverfn;
        params.command.environment={};
        params.command.environment.platform = "server";
        proxyprinttodiv('server calling execute params', params, 99, true);
        execute(params, function (err, res) {
            proxyprinttodiv('server results res',res, 99, true, true);
            // reset back to local
            params.command.environment=tempenvironment;           
            checkenviornment(params.command.environment); // reload environment
            callback(err, res);
        });
    }
    else
    {
        // server will override some command properties with the servers config defaults

        proxyprinttodiv('server calling ajax params', params, 99, true);
        executeAjax("", params, function (data) {
              proxyprinttodiv('server results data',data, 99, true);
              callback(null, data);
        });
    }
};


function executeAjax(allConfig, executeItem, callback, returnCallback) {
    var result;
    var success = false;
    result = "";

    //executeItem = "[" + JSON.stringify(executeItem) + "]";
    executeItem = JSON.stringify(executeItem);
    var ajaxUrl = window.location.origin + '/executethis';
    $.ajax({
        type: 'PUT',
        dataType: 'json',
        url: ajaxUrl,
        headers: {
            'content-type': 'application/json'
        },
        global: 'false',
        cache: 'false',
        async: 'false',
        data: executeItem,
        success: function (data) {
            // alert(JSON.stringify(data));
            if (data.error) {
                result = "<pre> APPLICATION ERROR: </pre>" + JSON.stringify(data);
            } else {
                if (Object.keys(data).length > 0) {
                    result = "<pre> SUCCESS: </pre>" + JSON.stringify(data);
                } else {
                    result = "<pre> <<< No Data Returned >>> </pre>";
                }
            }
            callback(data, allConfig, 'html', returnCallback);
        },
        error: function (XHR, textStatus, errorThrown) {
            alert(JSON.stringify(textStatus + errorThrown));
            result = "FAILED TO CALL EXECUTETHIS " + JSON.stringify(errorThrown);
            callback(errorThrown, allConfig, 'html', returnCallback);
        }
    });
}


exports.getFromLocalStorage = window.getFromLocalStorage = getFromLocalStorage = function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
};

exports.addToLocalStorage = window.addToLocalStorage = addToLocalStorage = function addToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
};

exports.clearLocalStorage = window.clearLocalStorage = clearLocalStorage = function clearLocalStorage(p, callback) 
{
    proxyprinttodiv('clear clearLocalStorage', 'hi', 99);
    if (config.configuration.environment === 'local') 
    {   //clearLocalStorage();
        localStorage.clear();
        if (typeof callback == 'function') { callback(null, null); } else {return}
    }
    else
    {   
        if (typeof callback == 'function') { callback(null, null); } else {return}
    }
};

exports.removeFromLocalStorage = window.removeFromLocalStorage = removeFromLocalStorage = function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
};


exports.mquery = mquery = function mquery(inboundobj,projectionparams, command, callback) {
        proxyprinttodiv('Function inboundobj', inboundobj, 28);
        proxyprinttodiv('Function command', command, 28);

        function IsJsonString(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        var query = inboundobj;
        var outlist = [];
        var resultlist = [];
        var collection = command.collection;
        //var keycollection = command.collection + "key"; // not used for anything
        var databasetable = command.databasetable;
        var keydatabase = {};
        var eachwid;

        var database = {};

        // if command.indb sent in then use that database
        // can also just send in parameter queryresult with database as value
        if (command.indb) 
        {
            database = command.queryresult;
        }
        else
        {
            database = getFromLocalStorage(databasetable + collection);
        }

        proxyprinttodiv('Function inlist', database, 28, true);
        if (database) {
            proxyprinttodiv('before IsJsonString', inboundobj, 28);
            if (IsJsonString(inboundobj)) {
                query = JSON.parse(inboundobj);
            }
            proxyprinttodiv('Function query', query, 28);

            outlist = sift(query, database);

            // if date exists , return in date descending order
            resultlist = outlist.sort(function (aObj, bObj) {
                return Date.parse(aObj["metadata"]["date"]) - Date.parse(bObj["metadata"]["date"]);
            });

            }
        else {
            resultlist = [];
        }

        proxyprinttodiv('Function resultlist', resultlist, 28);
        callback(null, resultlist);

};


// Primary execute function called after dothis

function test2(params, callback) {
    callback(null, {
        "test": "test2 on local called"
    });
}


exports.test_return_noerror_result_local = test_return_noerror_result_local = function test_return_noerror_result_local (param, callback) 
{
    // debugger;
    proxyprinttodiv('test_return_noerror_result_local- incoming parm', param, 99);
    var error_obj = null;
    var env = param.command.environment.platform;
    if (env==="server" && param.serverfn)     // if environment = server and serverfn parameter exist then redirect 
                                              // to different function--that way we can on same machine pass locally and
                                              // fail server
    {
        param.command.xrun=param.serverfn;
        delete param.serverfn;
        proxyprinttodiv('test ***** calling server', param, 99);
        execute(param, callback);
    } else {
        var result_obj = { 'a':'b', env: env };
        callback( error_obj, result_obj );
    }
};

	// series, level 0, 1 function that passes locally
	exports.local_serieslevel0pass1 = 
	local_serieslevel0pass1 = 
	function local_serieslevel0pass1(executeobject, callback) 
	{
		  if (!executeobject.command) {
              executeobject.command={};
              executeobject.command.environment={};
              executeobject.command.environment.run={};
          }
		  
		  //executeobject.command.environment.run.type="series"
          executeobject.command.executetype="series"
		  executeobject.command.environment.run.executelevel=0;
		  executeobject.command.environment.platform='local';          // used for server testing
		  executeobject.command.processfn="execute_function";          // what function handles functions

		  executeobject.command.xrun={"executethis": 'test_return_noerror_result_local'};

		  var etEnvironment = new DriEnvironment(executeobject.command.environment);
		  etEnvironment.execute(executeobject, function (error_obj, result_obj) 
		  {        
				var result_assertion={"a":"b", "env":executeobject.command.environment.platform};               
				proxyprinttodiv('expected error', null, 99);
				proxyprinttodiv('actual error', error_obj, 99);
				proxyprinttodiv('expected result', result_assertion, 99);
				proxyprinttodiv('actual result', result_obj, 99);

				var composite_obj = logverifycomplex("local_serieslevel0pass1", result_obj, result_assertion, error_obj, null);
				proxyprinttodiv('composite_obj', composite_obj, 99);
				callback(null, composite_obj)
		  });

	};
	
	// series, level 0, tries to execute a function that only exists on server and so should fail
	exports.local_serieslevel0fail1 = 
	local_serieslevel0fail1 = 
	function local_serieslevel0fail1(executeobject, callback) 
	{
		  if (!executeobject.command) {
              executeobject.command={};
              executeobject.command.environment={};
              executeobject.command.environment.run={};
          }
		  
          //executeobject.command.environment.run.type="series"
          executeobject.command.executetype="series"
		  executeobject.command.environment.run.executelevel=0;
		  executeobject.command.environment.platform='local';          // used for server testing
		  executeobject.command.processfn="execute_function";          // what function handles functions

		  executeobject.command.xrun={"executethis": 'test_return_noerror_result_server'};

		  var etEnvironment = new DriEnvironment(executeobject.command.environment);
		  etEnvironment.execute(executeobject, function (error_obj, result_obj) 
		  {        
				//var result_assertion={"a":"b", "env":executeobject.command.environment.platform};               
				proxyprinttodiv('expected error', global_failnotfound, 99);
				proxyprinttodiv('actual error', error_obj, 99);
				proxyprinttodiv('expected result', null, 99);
				proxyprinttodiv('actual result', result_obj, 99);

				var composite_obj = logverifycomplex("local_serieslevel0pass1", result_obj, null, error_obj, global_failnotfound);
				proxyprinttodiv('composite_obj', composite_obj, 99);
				callback(null, composite_obj)
		  });

	};
