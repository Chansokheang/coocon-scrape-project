/* jshint -W107 */
var moduleVersion = '0.0.1'; // Module version number
var BankName = 'LMS'; // Name of the website
console.log(BankName + " 스크립트 호출됨."); // Script called
console.log("Version: " + moduleVersion);

// Form data template structure
var formDataTemplate = {
    url: "",
    method: "",
    headers: {},
    formData: {}
};

function iSASObject() {
    console.log("iSASObject 생성자 호출"); // iSASObject constructor called
    this.iSASInOut = {};

    this.UID = '';
    this.AESKey = '';
    this.EncKey = '';
    this.KeyValue = '';
    this.KeyStr = '';

    this.LowerTempStr = '';
    this.imgBase64 = '';
}

iSASObject.prototype.log = function(logMsg) {
    try {
        SASLog("iSASObject.Log(" + logMsg + "\")");
    } catch (e) {
        console.log("iSASObject.Log(" + logMsg + "\")");
    }
};

iSASObject.prototype.setError = function(errcode) {
    this.iSASInOut.Output = {};
    this.iSASInOut.Output.ErrorCode = errcode.toString(16).toUpperCase();
    this.iSASInOut.Output.ErrorMessage = getCooconErrMsg(errcode.toString(16).toUpperCase());
};

///////////////////////////////////////////////////////////////////////////////
var NOTICE = function() {
    console.log(BankName + " 생성자 호출"); // Constructor called
    this.errorMsg = "";
    this.host = 'https://lms.chungbuk.ac.kr';
    this.url = "";
    this.userAgent = "{}";
    this.param = "";
    this.postData = "";
    this.xgate_addr = "";
    this.bLogIn = false;
    this.formData = {};
};

NOTICE.prototype = Object.create(iSASObject.prototype);

NOTICE.prototype.NOTICE_LIST = function(aInput) {
    this.log(BankName + " 공지사항 조회 호출 [" + aInput + "][" + moduleVersion + "]"); // Notice List Call
    try {
        var input = dec(aInput.Input);

        var username = input.username;  // LMS username
        var password = input.password;  // LMS password

        // Step 1: Access the login page
        this.url = "/login/index.php";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Login Page URL: [" + this.host + this.url + "]");
        this.log("Login Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Step 2: Prepare form data for login POST request
        this.postData = "";
        this.postData += "username=" + httpRequest.URLEncode(username, "UTF-8");
        this.postData += "&password=" + httpRequest.URLEncode(password, "UTF-8");
        this.postData += "&rememberusername=1";

        // Step 3: Send POST request to login
        if (!httpRequest.post(this.host + this.url, this.postData, "application/x-www-form-urlencoded")) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }

        // Step 4: Navigate to the announcements page
        this.url = "/mod/ubboard/view.php?id=17";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        
        ResultStr = httpRequest.result;
        this.log("Announcements Page URL: [" + this.host + this.url + "]");
        this.log("Announcements Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};
        this.iSASInOut.Output.Result.announcements = [];

        // Extract the table rows containing announcements
        var tableContent = StrGrab(ResultStr, '<tbody>', '</tbody>');
        if (tableContent) {
            // Split the table content into rows
            var rows = tableContent.split('<tr');
            
            // Skip the first element as it's empty
            for (var i = 1; i < rows.length; i++) {
                var row = rows[i];
                
                // Extract announcement number
                var noSection = StrGrab(row, '<td class="text-center">', '</td>');
                var no = StrTrim(noSection);
                
                // Extract title
                var titleSection = StrGrab(row, 'class="t-subject"', '</td>');
                var title = StrGrab(titleSection, '">', '</a>').trim();
                
                // Extract date
                var dateSection = StrGrab(row, '<td class="text-center d-none d-md-table-cell">', '</td>');
                var date = StrTrim(dateSection);
                
                // Extract views
                var viewsSection = StrGrab(row, '<td class="text-center d-none d-md-table-cell">', '</td>', 2);
                var views = StrTrim(viewsSection);
                
                // Add to announcements array
                if (title) {
                    this.iSASInOut.Output.Result.announcements.push({
                        no: no,
                        title: title,
                        date: date,
                        views: views
                    });
                }
            }
        }

        // Add metadata
        this.iSASInOut.Output.Result.url = this.host + this.url;
        this.iSASInOut.Output.Result.totalCount = this.iSASInOut.Output.Result.announcements.length;

        return S_IBX_OK;
    } catch (e) {
        this.log("exception " + e.message);
        this.setError(E_IBX_UNKNOWN);
        return E_IBX_UNKNOWN;
    } finally {
        system.setStatus(IBXSTATE_DONE, 100);
        this.log(BankName + " Notice List finally");
    }
};

function OnInit() {
    console.log("OnInit()");
    try {
        //Load necessary components
        if (!system.include("iSASTypes")) {
            sleep(500);
            console.log('iSASTypes_Boolean : [' + system.include("iSASTypes") + ']');
        }
        if (!system.include("sas/sas")) {
            sleep(500);
            console.log('sas_Boolean : [' + system.include("sas/sas") + ']');
        }
        system.setStatus(IBXSTATE_BEGIN, 0);
    } catch (e) {
        console.log("Exception OnInit:[" + e.message + "]");
    } finally {
    }
}

function Execute(aInput) {
    console.log("Execute[" + aInput + "]");
    try {
        console.log("Init Default Error");
        iSASObj = JSON.parse(aInput);
        iSASObj.Output = {};
        iSASObj.Output.ErrorCode = '8000F110';
        iSASObj.Output.ErrorMessage = "Failed to execute the module.";

        OnInit();

        iSASObj = JSON.parse(aInput);
        var ClassName = iSASObj.Class;
        var ModuleName = iSASObj.Module;
        if (Failed(SetClassName(ClassName, ModuleName))) {
            iSASObj.Output = {};
            iSASObj.Output.ErrorCode = '8000F111';
            iSASObj.Output.ErrorMessage = "Please check the Class name and Job name.";
        } else {
            obj.iSASInOut = "";
            OnExcute(0, JSON.stringify(iSASObj));

            console.log("Result test [" + obj.iSASInOut + "]");

            if (obj.iSASInOut != "")
                iSASObj = obj.iSASInOut;
        }
    } catch (e) {
        console.log("exception:[" + e.message + "]");
    } finally {
        return JSON.stringify(iSASObj);
    }
}
/* jshint +W107 */