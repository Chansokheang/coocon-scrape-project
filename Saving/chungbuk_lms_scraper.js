/* jshint -W107 */
var moduleVersion = "25.4.12.1";
var ScraperName = "Chungbuk LMS Scraper";
console.log(ScraperName + " script called.");
console.log("Version: " + moduleVersion);

// Form data template structure
var formDataTemplate = {
    url: "",
    method: "",
    headers: {},
    formData: {}
};

function iSASObject() {
    console.log("iSASObject constructor called");
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
    //TODO: Error message retrieval part
    this.iSASInOut.Output.ErrorMessage = getCooconErrMsg(errcode.toString(16).toUpperCase());
};

///////////////////////////////////////////////////////////////////////////////
var ChungbukLMS = function() {
    console.log(ScraperName + " ChungbukLMS constructor called");
    this.errorMsg = "";
    
    // Configuration for Chungbuk LMS
    this.host = "https://lms.chungbuk.ac.kr";
    this.loginUrl = "/login/index.php";
    this.announcementsUrl = "/mod/ubboard/view.php?id=17";
    this.userAgent = "{}";
    this.param = "";
    this.postData = "";
    this.xgate_addr = "";
    this.bLogIn = false;
    this.formData = {};
};

ChungbukLMS.prototype = Object.create(iSASObject.prototype);

ChungbukLMS.prototype.scrapeAnnouncements = function(aInput) {
    this.log(ScraperName + " ChungbukLMS scrapeAnnouncements called [" + aInput + "][" + moduleVersion + "]");
    try {
        system.setStatus(IBXSTATE_CHECKPARAM, 10);
        var input = dec(aInput.Input);

        var username = input.username;  // Student ID
        var password = input.password; // Account password

        // Step 1: Get the login page
        this.url = this.loginUrl;
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Login Page: [" + ResultStr.substring(0, 200) + "...]");

        // Step 2: Login to the system
        system.setStatus(IBXSTATE_LOGIN, 30);

        // Form data for login
        this.postData = "";
        this.postData += httpRequest.URLEncode("username", "UTF-8") + "=" + httpRequest.URLEncode(username, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("password", "UTF-8") + "=" + httpRequest.URLEncode(password, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("rememberusername", "UTF-8") + "=" + 0;

        // POST request to login
        if (!httpRequest.post(this.host + this.url, this.postData, "application/x-www-form-urlencoded")) {
            this.setError(E_IBX_FAILTOPOSTDATA);
            return E_IBX_FAILTOPOSTDATA;
        }

        ResultStr = httpRequest.result;
        this.log("Login Result: [" + ResultStr.substring(0, 200) + "...]");

        // Check if login was successful
        if (ResultStr.indexOf("Invalid login") >= 0) {
            this.setError(E_IBX_ACCOUNT_NO_INVALID);
            return E_IBX_ACCOUNT_NO_INVALID;
        }

        // Step 3: Navigate to the Announcements page
        system.setStatus(IBXSTATE_ENTER, 50);
        
        // Navigate to the announcements page
        if (!httpRequest.get(this.host + this.announcementsUrl)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        
        var announcementsResult = httpRequest.result;
        this.log("Announcements Page: [" + announcementsResult.substring(0, 200) + "...]");
        
        // Step 4: Extract all announcements
        var announcements = [];
        var announcementItems = announcementsResult.match(/<tr[^>]*class="[^"]*"[\s\S]*?<\/tr>/g);
        
        if (announcementItems && announcementItems.length > 0) {
            for (var i = 0; i < announcementItems.length; i++) {
                var item = announcementItems[i];
                
                // Skip header row
                if (item.indexOf('t-subject') === -1) continue;
                
                // Extract title
                var titleSection = StrGrab(item, 'class="t-subject"', '</td>');
                var title = StrGrab(titleSection, '<a[^>]*>', '</a>').trim();
                
                // Extract date
                var dateSection = StrGrab(item, 'class="text-center t-date"', '</td>');
                var date = StrGrab(dateSection, '<span[^>]*>', '</span>').trim();
                
                // Extract views
                var viewsSection = StrGrab(item, 'class="text-center t-viewcount"', '</td>');
                var views = StrGrab(viewsSection, '>', '</').trim().replace(/,/g, '');
                
                announcements.push({
                    title: title,
                    date: date,
                    views: views
                });
            }
        }

        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};
        
        // Form data template
        this.formData = {
            url: "https://lms.chungbuk.ac.kr/login/index.php",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            formData: {
                username: username,
                password: password,
                rememberusername: "0"
            }
        };

        // Add the scraped announcements to the output
        this.iSASInOut.Output.Result.formData = this.formData;
        this.iSASInOut.Output.Result.announcements = announcements;
        this.iSASInOut.Output.Result.currentUrl = this.host + this.announcementsUrl;
        
        return S_IBX_OK;
    } catch (e) {
        this.log("exception " + e.message);
        this.setError(E_IBX_UNKNOWN);
        return E_IBX_UNKNOWN;
    } finally {
        system.setStatus(IBXSTATE_DONE, 100);
        this.log(ScraperName + " ChungbukLMS scrapeAnnouncements finally");
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