/* jshint -W107 */
var moduleVersion = "25.3.19.1";
var BankName = "국민은행"; // Kookmin Bank
console.log(BankName + " 스크립트 호출됨."); // Script called
console.log("Version: " + moduleVersion);

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
    //TODO: 에러 메시지 가져오는 부분... // Part for retrieving error messages
    this.iSASInOut.Output.ErrorMessage = getCooconErrMsg(errcode.toString(16).toUpperCase());
};

///////////////////////////////////////////////////////////////////////////////
var 빠른조회 = function() {
    console.log(BankName + " 빠른조회 생성자 호출"); // Quick Inquiry constructor called
    this.errorMsg = "";
    this.host = "https://obank.kbstar.com";
    this.url = "";
    this.userAgent = "{}";
    this.param = "";
    this.postData = "";
    this.xgate_addr = "";
    this.bLogIn = false;
};

빠른조회.prototype = Object.create(iSASObject.prototype);

빠른조회.prototype.CheckResultOrder = function (aDataArray, aOrder) { 
    this.log("빠른조회.prototype.CheckResultOrder"); // QuickInquiry.prototype.CheckResultOrder

    if (aDataArray.length <= 1) return S_IBX_OK;

    for (var i = 0; i < aDataArray.length; i++) {
        this.log("aDataArray[" + i + "].출금액:[" + aDataArray[i].출금액 + "]");
        this.log("aDataArray[" + i + "].입금액:[" + aDataArray[i].입금액 + "]");
        this.log("aDataArray[" + i + "].거래후잔액:[" + aDataArray[i].거래후잔액 + "]");

        //취소건 처리는 주석 처리되어 있어서 일단 처리 않함.
        /*
         if aDataArray[i, 3] <> '' then begin
         if aDataArray[i, 0] = '0' then begin
         if StrPos('-', aDataArray[i, 1]) = 0 then
         aDataArray[i, 1] := '-' + aDataArray[i, 1]
         end else if aDataArray[i, 1] = '0' then begin
         if StrPos('-', aDataArray[i, 0]) = 0 then
         aDataArray[i, 0] := '-' + aDataArray[i, 0];
         end;
         end;
         */
        // 입/출금액이 둘 다 0이 아니면 오류 // Error if both deposit/withdrawal amount are not 0
        if ((aDataArray[i].출금액 != "0") && (aDataArray[i].입금액 != "0")) {
            return E_IBX_CURRENCY_NOT_CONVERT;
        }
    }

    try {
        var nCurr;
        // 최신 // recent
        if (aOrder == '0')
            nCurr = parseInt(aDataArray[0].거래후잔액) - parseInt(aDataArray[0].입금액) + parseInt(aDataArray[0].출금액);
        // 과거 // past
        else
            nCurr = parseInt(aDataArray[0].거래후잔액) + parseInt(aDataArray[1].입금액) - parseInt(aDataArray[1].출금액);

        // 거래금액 계산 결과값과 잔액 다르면 오류 // Error if the balance is different from the calculated result
        if (parseInt(aDataArray[1].거래후잔액) != nCurr) // Balance after transaction
            return E_IBX_RESULT_ORDER_VERFY_FAIL;
    } catch (e) {
    this.log("빠른조회.prototype.CheckResultOrder exception:[" + e.message + "]"); // QuickInquiry.prototype.CheckResultOrder exception
        return E_IBX_RESULT_ORDER_VERFY_FAIL;
    }

    return S_IBX_OK;
};

빠른조회.prototype.빠른잔액조회 = function(aInput) { // Quick Balance Inquiry
    this.log(BankName + " 빠른조회 빠른잔액조회 호출 [" + aInput + "][" + moduleVersion + "]"); // Quick Inquiry Quick Balance Inquiry Call
    try {
        system.setStatus(IBXSTATE_CHECKPARAM, 10);

        var input = dec(aInput.Input);
        // if (input.계좌비밀번호) this.iSASInOut.Input.계좌비밀번호 = input.계좌비밀번호.replace(/./g, '*');  // Account Password
        // if (input.주민사업자번호) this.iSASInOut.Input.주민사업자번호 = input.주민사업자번호.toString().replace(/./g, "*");  // Resident Business Registration Number

        var 계좌번호 = input.계좌번호;  // account number
        var 계좌비밀번호 = input.계좌비밀번호; // account password
        var ID = input.ID;
        var 주민사업자번호 = input.주민사업자번호; // Resident business registration number
        var 통화 = input.통화 && input.통화.toUpperCase();

        // 통화  // currency
        if (!통화 || 통화 == 'KRW') 통화 = "";
        
        // 미입력 체크 // Check for unentered items
        if (!ID && !주민사업자번호) {
            this.setError(E_IBX_USER_ACCOUNT_NOTENTER);
            return E_IBX_USER_ACCOUNT_NOTENTER;
        }

        // 8자리 입력 시 오류 없이 사용 (아이디 우선) // Use without error when entering 8 digits (ID priority)
        if (!ID){
            if(주민사업자번호.length == 8){
                주민사업자번호 = 주민사업자번호.substr(2, 6);
            }
        }

        // 계좌번호 확인 // Account number check
        if (계좌번호 == "" || 계좌번호 == undefined) {
            this.setError(E_IBX_ACCOUNT_NO_NOTENTER);
            return E_IBX_ACCOUNT_NO_NOTENTER;
        }

        // 계좌번호 숫자/자리수 16자 이내 체크 // Check account number digits/numbers within 16 digits
        if (!/^\d{1,16}$/.test(계좌번호)) {
            this.setError(E_IBX_ACCOUNT_NO_INVALID);
            return E_IBX_ACCOUNT_NO_INVALID;
        }

        // 계좌비밀번호 확인 // Account password check
        if (계좌비밀번호 == "" || 계좌비밀번호 == undefined) {
            this.setError(E_IBX_ACCOUNT_PASSWORD_NOTENTER);
            return E_IBX_ACCOUNT_PASSWORD_NOTENTER;
        }

        // 비밀번호 숫자 & 자리수 4자 이내 체크 // Check password digits & numbers within 4 digits
        if (!/^\d{4}$/.test(계좌비밀번호)) {
            this.setError(E_IBX_ACCOUNT_PASSWORD_INVALID);
            return E_IBX_ACCOUNT_PASSWORD_INVALID;
        }

        // 통화 // currency
        if (통화 && 통화.length != 3) {
            this.setError(E_IBX_CURRENCY_INVALID);
            return E_IBX_CURRENCY_INVALID;
        }

        system.setStatus(IBXSTATE_LOGIN, 30);
        this.url = "/quics?page=C025255&cc=b028364:b028702&QSL=F";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Login: [" + ResultStr + "]");

        if (ResultStr.indexOf('사용자가 많아 잠시 후 이용하여') >= 0) {
            this.setError(E_IBX_SITE_INTERNAL);
            return E_IBX_SITE_INTERNAL;
        }

        var 오늘날짜 = StrGrab(ResultStr, "getToday = \"", "\"");
        var tagName = StrGrab(ResultStr, "name='KEYPAD_TYPE_", "'");

        if (!오늘날짜 || !tagName) {
            this.setError(E_IBX_SITE_INVALID);
            return E_IBX_SITE_INVALID;
        }

        // Main > 계좌조회
        system.setStatus(IBXSTATE_LOGIN, 40);

        // 주민사업자번호 입력 시, 주민사업자번호로 조회 /// When entering a resident business registration number, search by resident business registration number
        this.postData = "KEYPAD_TYPE_" + tagName + "=" + StrGrab(ResultStr, "name='KEYPAD_TYPE_" + tagName + "' value=\"", "\"");
        this.postData += "&KEYPAD_HASH_" + tagName + "=";
        this.postData += "&KEYPAD_USEYN_" + tagName + "=" + StrGrab(ResultStr, "name='KEYPAD_USEYN_" + tagName + "' value=\"", "\"");
        this.postData += "&KEYPAD_INPUT_" + tagName + "=" + httpRequest.URLEncode(StrGrab(ResultStr, "name='KEYPAD_INPUT_" + tagName + "' value=\"", "\""), "UTF-8");
        this.postData += "&signed_msg=";
        this.postData += "&" + httpRequest.URLEncode("요청키", "UTF-8") + "="; // 요청키 // Request key
        this.postData += "&" + httpRequest.URLEncode("계좌번호", "UTF-8") + "=" + 계좌번호; // Account number
        this.postData += "&" + httpRequest.URLEncode("조회시작일자", "UTF-8") + "=" + 오늘날짜; // 조회시작일자 // Start date
        this.postData += "&" + httpRequest.URLEncode("조회종료일", "UTF-8") + "=" + 오늘날짜; // 조회종료일 // End date
        this.postData += "&" + httpRequest.URLEncode("빠른조회", "UTF-8") + "=" + "Y"; // 빠른조회 // Quick inquiry
        this.postData += "&" + httpRequest.URLEncode("조회계좌", "UTF-8") + "=" + 계좌번호; // 조회계좌 // Inquiry account
        this.postData += "&" + httpRequest.URLEncode("비밀번호", "UTF-8") + "=" + 계좌비밀번호; // 비밀번호 // Password
        this.postData += '&' + httpRequest.URLEncodeAll('조회시작년') + '=' + 오늘날짜.substr(0, 4); // 조회시작년 // Start year
        this.postData += '&' + httpRequest.URLEncodeAll('조회시작월') + '=' + 오늘날짜.substr(4, 2); // 조회시작월 // Start month
        this.postData += '&' + httpRequest.URLEncodeAll('조회시작일') + '=' + 오늘날짜.substr(6, 2); // 조회시작일 // Start day
        this.postData += '&' + httpRequest.URLEncodeAll('조회끝년') + '=' + 오늘날짜.substr(0, 4); // 조회끝년 // End year
        this.postData += '&' + httpRequest.URLEncodeAll('조회끝월') + '=' + 오늘날짜.substr(4, 2); // 조회끝월 // End month
        this.postData += '&' + httpRequest.URLEncodeAll('조회끝일') + '=' + 오늘날짜.substr(6, 2); // 조회끝일 // End day
        this.postData += "&" + httpRequest.URLEncode("조회구분", "UTF-8") + "=" + "2"; // 전체 // All
        this.postData += "&" + httpRequest.URLEncode("응답방법", "UTF-8") + "=" + "2"; // 최근 // Latest
  
        if (ID) {
            this.postData += "&" + httpRequest.URLEncode("고객ID", "UTF-8") + "=" + ID.toUpperCase(); // 고객ID // Customer ID
            this.postData += "&" + httpRequest.URLEncode("주민사업자번호", "UTF-8") + "="; // 주민사업자번호 // Resident business registration number
            this.postData += "&" + httpRequest.URLEncode("고객식별번호", "UTF-8") + "=" + ID.toUpperCase(); // 고객식별번호 // Customer identification number
            this.postData += "&" + httpRequest.URLEncode("검색구분", "UTF-8") + "=" + "1"; // 검색구분 // Search classification
        } else {
            this.postData += "&" + httpRequest.URLEncode("주민사업자번호", "UTF-8") + "=" + 주민사업자번호; // 주민사업자번호 // Resident business registration number
            this.postData += "&" + httpRequest.URLEncode("고객식별번호", "UTF-8") + "="; // 고객식별번호 // Customer identification number
            this.postData += "&" + httpRequest.URLEncode("검색구분", "UTF-8") + "=" + "2"; // 검색구분 // Search classification
        }

        if (계좌번호.length == 14) { // 14자리 계좌번호 // 14-digit account number
            if (계좌번호.substr(4, 2) == '68') {
                if (!통화) { 
                    this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028795";
                } else {
                    this.url = "/quics?chgCompId=b028795&baseCompId=b028702&page=C025255&cc=b028702:b028795"; // 외화 계좌번호 // Foreign currency account number
                }
            } else if (계좌번호.substr(4, 3) == '497') { // 497 계좌번호 // 497 account number
                this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b043371";
            } else {
                this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770";
            }
        } else if (계좌번호.length == 12) { // 12자리 계좌번호 // 12-digit account number
            if (계좌번호.substr(3, 2) == '42') {
                this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028795";
            } else if (계좌번호.substr(3, 2) == '17') {
                this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b043371";
            } else {
                this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770";
            }
        } else {
            this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770"; // execute this line of code
        }

        if (!this.url) {
            this.setError(E_IBX_ACCOUNT_NO_INVALID);
            return E_IBX_ACCOUNT_NO_INVALID;
        }

        // =========================================================
        /*
        Sending Request to the server with POST method.
        */
       // =========================================================
        if (!httpRequest.post(this.host + this.url, this.postData)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        
        ResultStr = httpRequest.result;
        this.log("result2: [" + ResultStr + "]");

        /*{
            "[계좌번호] 값은 필수항목 입니다" 오전 9시 이전 조회시 국민은행 사이트 장애로 재통신 로직 추가. // The [account number] value is a required item. Added re-communication logic due to Kookmin Bank site failure before 9:00 AM.
            재통신 후에도 동일한 오류 발생시 서버오류처리함(80002F30) // If the same error occurs after re-communication, the server error is processed (80002F30)
        }*/
        if (StrGrab(ResultStr, 'id="errCd">', '</').indexOf('CBN13000') >= 0) {
            if (!httpRequest.post(this.host + this.url, this.postData)) {
                this.setError(E_IBX_FAILTOGETPAGE);
                return E_IBX_FAILTOGETPAGE;
            }
            ResultStr = httpRequest.result;
            this.log("result_re: [" + ResultStr + "]");
        }

        // Error check
        if (ResultStr.indexOf('조회가능한 예금종류가 아닙니다') >= 0) { // 조회가능한 예금종류가 아닙니다 // The deposit type that can be queried is not available
            this.setError(E_IBX_ACCOUNT_NO_WRITEONLY);
            return E_IBX_ACCOUNT_NO_WRITEONLY;
        }

        if ((ResultStr.indexOf("해당계좌는 빠른서비스 조회계좌로 등록되지않았습니다") >= 0) || // The account in question is not registered as a quick service inquiry account.
            (ResultStr.indexOf("해당 계좌는 빠른조회 서비스 이용계좌로 등록되지 않았습니다") >= 0) || // The account in question is not registered as a quick inquiry service account.
            (ResultStr.indexOf("빠른조회서비스 미등록 계좌입니다") >= 0) || // The account in question is not registered as a quick inquiry service account.
            (ResultStr.indexOf("해당계좌는 빠른서비스 조회계좌 이미해지되었습니다") >= 0)) { // The account in question has already been terminated as a quick service inquiry account.
            this.setError(E_IBX_SERVICE_DENIED_2);
            return E_IBX_SERVICE_DENIED_2;
        }
        if ((ResultStr.indexOf("입력한 계좌번호는 존재하지") >= 0) || // The entered account number does not exist
            (ResultStr.indexOf("계좌번호가일치하지않읍니다") >= 0) || // The account number does not match
            (ResultStr.indexOf("계좌번호가 일치하지 않습니다") >= 0) || // The account number does not match
            (ResultStr.indexOf("계좌번호 입력 오류입니다.") >= 0) ||    // Account number input error
            (ResultStr.indexOf("계좌번호 오류입니다") >= 0) || // // Account number error
            (ResultStr.indexOf("계좌번호가 빠른조회서비스에 등록되어 있지 않습니다") >= 0) || // The account number is not registered for quick inquiry service
            (ResultStr.indexOf("이용이 불가능한 계좌이거나 메뉴선택이 잘못 되었습니다") >= 0) || // The account is not available or the menu selection is incorrect
            (ResultStr.indexOf("올바른 계좌번호를 입력하여 주십시오") >= 0) || // Please enter a valid account number
            (ResultStr.indexOf("계좌번호 확인 후 거래하여") >= 0) || // Please check the account number and proceed with the transaction
            (ResultStr.indexOf("계좌번호가 잘못 입력되었습니다") >= 0)) {   // The account number has been entered incorrectly
            this.setError(E_IBX_ACCOUNT_NO_INVALID);
            return E_IBX_ACCOUNT_NO_INVALID;
        }

        if (ResultStr.indexOf("이용이불가능한계좌") >= 0) { // The account is not available
            this.setError(E_IBX_USER_ACCOUNT_DENIED);
            return E_IBX_USER_ACCOUNT_DENIED;
        }

        if ((ResultStr.indexOf("본인의 주민등록번호 또는 사업자번호를 잘못입력하셨습니다") >= 0) || // You have entered your resident registration number or business registration number incorrectly
            (ResultStr.indexOf("계좌번호또는주민등록(사업자)번호가일치하지않습니다") >= 0) || // The account number or resident registration (business registration) number does not match
            (ResultStr.indexOf("계좌번호 또는 주민등록(사업자)번호가 일치하지 않습니다") >= 0) || // The account number or resident registration (business registration) number does not match
            (ResultStr.indexOf("주민번호 또는 사업자 번호를 정확히 입력하십시오") >= 0) || // 아이디 틀릴때에도 동일한 메세지 나옴 // The same message appears when the ID is incorrect
            (ResultStr.indexOf("주민등록번호가 다릅니다") >= 0) || // The resident registration number is different
            (ResultStr.indexOf("본인명의의 계좌만 조회 및 거래가 가능합니다") >= 0)) { // 계좌번호, 계좌비밀번호, 사업자번호 오류 시 동일한 오류 메세지 // The same error message appears for account number, account password, and business registration number
            this.setError(E_IBX_REGNO_RESIDENT_INVALID);
            return E_IBX_REGNO_RESIDENT_INVALID;
        }

        // 입력파라미터 오류(지금까지는 전부 아이디 오류였음) // Input parameter error (so far, all ID errors)
        if ((ResultStr.indexOf("[오류코드:Z491") >= 0) || // Error code: Z491
            (ResultStr.indexOf("업무처리 오류입니다") >= 0)) { // Processing error
            this.setError(E_IBX_USER_ACCOUNT_INVALID);
            return E_IBX_USER_ACCOUNT_INVALID;
        }

        if ((ResultStr.indexOf("고객아이디가 없거나") >= 0) || // The customer ID is missing or
            (ResultStr.indexOf("해지된 사용자 ID입니다") >= 0) || // // The user ID has been terminated
            (ResultStr.indexOf("서브아이디로는 거래가 불가합니다") >= 0) || // Transactions are not possible with sub-IDs
            (ResultStr.indexOf("로그인하신 ID가 유효하지 않습니다") >= 0) || // The logged-in ID is invalid
            (ResultStr.indexOf("(UKFK0166)") >= 0) || // (UKFK0166)
            (ResultStr.indexOf("사용자ID를 확인하여 입력해 주십시오") >= 0) || // Please check the user ID and enter it
            (ResultStr.indexOf("인터넷뱅킹ID는 영문과 숫자만 입력가능합니다.") >= 0) || // The Internet banking ID can only be entered in English and numbers
            (ResultStr.indexOf("ID를 확인하여 입력해") >= 0)) { // Please check the ID and enter it
            this.setError(E_IBX_KEY_ACCOUNT_INFO_2_INVALID);
            return E_IBX_KEY_ACCOUNT_INFO_2_INVALID;
        }

        if (ResultStr.indexOf("지연되고 있습니다.") >= 0) {         // It is delayed.
            this.setError(E_IBX_SERVICE_SERVERBUSY);
            return E_IBX_SERVICE_SERVERBUSY;
        }

        if ((ResultStr.indexOf("비밀번호 3회이상오류") >= 0) || // // Password 3 times or more error
            (ResultStr.indexOf("비밀번호 3회 오류입니다") >= 0)) { // Password 3 times error
            this.setError(E_IBX_ACCOUNT_PASSWORD_JUSTBEFOREDENY);
            return E_IBX_ACCOUNT_PASSWORD_JUSTBEFOREDENY;
        }

        if ((ResultStr.indexOf("회 오류입력되었습니다") >= 0) || // Error input
            (ResultStr.indexOf("회 오류 입력되었습니다") >= 0) || // Error input
            (ResultStr.indexOf("회 오류 입력 되었습니다") >= 0) || // Error input
            (ResultStr.indexOf("비밀번호 1회오류 등록") >= 0) || // // Password 1 time error registration
            (ResultStr.indexOf("비밀번호 2회오류 등록") >= 0) ||// // Password 2 times error registration
            (ResultStr.indexOf("계좌 비밀번호 1회오류 및 2회오류가 등록되었습니다") >= 0)) { // Account password 1 time error and 2 times error have been registered
            this.setError(E_IBX_ACCOUNT_PASSWORD_INVALID);
            return E_IBX_ACCOUNT_PASSWORD_INVALID;
        }

        if ((ResultStr.indexOf("비밀번호 4회 이상 오류") >= 0) || // Password 4 times or more error
            (ResultStr.indexOf("계좌 비밀번호가 4회 오류") >= 0)) {// // Account password 4 times error
            this.setError(E_IBX_ACCOUNT_PASSWORD_DENIED);
            return E_IBX_ACCOUNT_PASSWORD_DENIED;
        }

        if ((ResultStr.indexOf("서비스 장애 중 입니다.") >= 0) || // Service is down.
            (ResultStr.indexOf("사용자가 많아 잠시 후 이용하") >= 0) || // // There are many users, so please use it after a while
            (ResultStr.indexOf("은행 HOST쪽에 데이타 수신 오류입니다") >= 0) || // // There is a data reception error on the bank HOST side
            (ResultStr.indexOf("일자 전환 중 잠시 후 거래하여 주시기 바랍니다.") >= 0) ||// // Please wait a moment while switching the date.
            (StrGrab(ResultStr, 'id="errCd">', '</').indexOf("CBN13000") >= 0)) {
            this.setError(E_IBX_SITE_INTERNAL);
            return E_IBX_SITE_INTERNAL;
        }

        if ((ResultStr.indexOf("(EMCITBC007)") >= 0) || // // (EMCITBC007)
            (ResultStr.indexOf("지금은 일자전환 및 거래제한으로 인해 잠시 동안 서비스가 불가합니다") >= 0) || // // The service is temporarily unavailable due to date conversion and transaction restrictions.
            (ResultStr.indexOf("현재는 시스템 정기점검 작업 시간입니다") >= 0)) { // // The current time is the system regular inspection work time.
            this.setError(E_IBX_SERVICE_NOTIME);
            return E_IBX_SERVICE_NOTIME;
        }

        if ((ResultStr.indexOf("휴면계좌") >= 0) || // // Dormant account
            (ResultStr.indexOf("존재하지 않거나") >= 0)) { // // Does not exist or
            this.setError(E_IBX_ACCOUNT_NO_MISC);
            return E_IBX_ACCOUNT_NO_MISC;
        }

        if (ResultStr.indexOf('거래내역조회 신청이 불가능합니다') > -1) { // // Transaction history inquiry application is not possible
            this.setError(E_IBX_ACCOUNT_NO_MISC);
            this.iSASInOut.Output.ErrorMessage = "Please check if the account number was entered correctly. CMS accounts, securities passbooks, interim payment accounts, apartment maintenance fee passbooks, and virtual accounts cannot apply for transaction history inquiry.";
            return E_IBX_ACCOUNT_NO_MISC;
        }

        // 개인고객 & 로그인 패스워드 오류초과 // Personal customer & login password error exceeded
        if ((ResultStr.indexOf("사용자암호가 3회 입력오류") >= 0) || // // User password 3 times input error
            (ResultStr.indexOf("사용자 암호가 3회 연속 오류") >= 0) || // // User password 3 times in a row error
            (ResultStr.indexOf("사용자 암호 오류 해제 후") >= 0) || // // User password error release
            (ResultStr.indexOf("사용자암호 3회 입력오류") >= 0)) { // // User password 3 times input error
            this.setError(E_IBX_USER_PASSWORD_DENIED);
            return E_IBX_USER_PASSWORD_DENIED;
        }

        if (ResultStr.indexOf("조회가능한 예금종류가 아닙니다.") >= 0) { // The deposit type that can be queried is not available.
            this.setError(E_IBX_ACCOUNT_CLASS_INVALID);
            return E_IBX_ACCOUNT_CLASS_INVALID;
        }

        if (StrGrab(ResultStr, '<div id="errorDiv"', '">').indexOf('display:block') >= 0) {
            this.setError(E_IBX_UNKNOWN);
            return E_IBX_UNKNOWN;
        }

        system.setStatus(IBXSTATE_RESULT, 80);

        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};
        this.iSASInOut.Output.Result.url = this.host + this.url, this.postData; // testing this output
        // 예금명 // Deposit name
        this.iSASInOut.Output.Result.예금명 = StrGrab(StrGrab(ResultStr, ">계좌정보<", "</tr>"), "<td", "</td>"); 
        this.iSASInOut.Output.Result.예금명 = StrGrab(this.iSASInOut.Output.Result.예금명, ">", ""); // Remove ">" and "<"
        this.iSASInOut.Output.Result.예금명 = StrGrab(this.iSASInOut.Output.Result.예금명, "(", ")"); // Remove "(" and ")"
        this.iSASInOut.Output.Result.예금명 = StrTrim(this.iSASInOut.Output.Result.예금명);
        this.iSASInOut.Output.Result.rawHTML = ResultStr;

        if (!this.iSASInOut.Output.Result.예금명) { // Account name
            this.setError(E_IBX_RESULT_FAIL);
            return E_IBX_RESULT_FAIL;
        }

        // 계좌번호 // Account number
        this.iSASInOut.Output.Result.계좌번호 = 계좌번호; // Account number

        // 통화코드 // Currency code
        this.iSASInOut.Output.Result.통화코드 = "";
        
        if (통화) {
            var tbBlock = StrGrab(ResultStr, '>계좌정보<', '</tbody>'); // Account information
            if (!tbBlock) {
                this.setError(E_IBX_SITE_INVALID + 1);
                return E_IBX_SITE_INVALID + 1;
            }

            var 통화코드 = '', Col_Block = ''; // Currency code
            var index = 1;
            var is통화 = false;  
            while (true) {
                Col_Block = StrGrab(tbBlock, '<tr', '</tr>', index++);
                if (!Col_Block) break;

                통화코드 = StrGrab(StrGrab(StrGrab(Col_Block, '>통화코드<', '</td>'), '<td', ''), '>', ''); // Currency code
                통화코드 = 통화코드.replace(/[\s,]/g, ""); //Remove Space New Line and , // Remove Space New Line and ,
                통화코드 = StrTrim(통화코드);// Remove Space New Line and , // Remove Space New Line and ,
                if (통화코드 == 통화) {// If the currency code is the same as the input currency
                    is통화 = true;

                    // 통화코드 // Currency code
                    this.iSASInOut.Output.Result.통화코드 = 통화코드;// Currency code

                    // 잔액 // Balance
                    this.iSASInOut.Output.Result.잔액 = StrGrab(StrGrab(StrGrab(Col_Block, '>통화별금액<', '</td>'), '<td', ''), '>', ''); // Currency amount
                    this.iSASInOut.Output.Result.잔액 = this.iSASInOut.Output.Result.잔액.replace(/[\s,]/g, ""); //Remove Space New Line and , // Remove Space New Line and ,
                    this.iSASInOut.Output.Result.잔액 = StrTrim(this.iSASInOut.Output.Result.잔액);// Remove Space New Line and , // Remove Space New Line and ,

                    // 출금가능액 // Withdrawable amount
                    this.iSASInOut.Output.Result.출금가능금액 = "";// Withdrawable amount

                    if (!IsCurrency(this.iSASInOut.Output.Result.잔액)) {// If the balance is not a currency
                        this.setError(E_IBX_CURRENCY_NOT_CONVERT);
                        return E_IBX_CURRENCY_NOT_CONVERT;
                    }
                    break;
                }
            }

            // 통화 입력 오류검증// Currency input error verification
            if (!is통화) {
                this.setError(E_IBX_CURRENCY_INVALID);
                return E_IBX_CURRENCY_INVALID;
            }
        } else {

            // 잔액 // Balance
            this.iSASInOut.Output.Result.잔액 = StrGrab(StrGrab(ResultStr, ">총잔액<", "</tr>"), "<td", "/td>"); // Total balance
            this.iSASInOut.Output.Result.잔액 = StrGrab(this.iSASInOut.Output.Result.잔액, ">", "<"); // Remove ">" and "<"
            this.iSASInOut.Output.Result.잔액 = this.iSASInOut.Output.Result.잔액.replace(/[\s,]/g, ""); //Remove Space New Line and ,
            this.iSASInOut.Output.Result.잔액 = StrTrim(this.iSASInOut.Output.Result.잔액);// Remove Space New Line and , // Remove Space New Line and ,

            // 출금가능액 // Withdrawable amount
            this.iSASInOut.Output.Result.출금가능금액 = StrGrab(StrGrab(ResultStr, ">출금가능잔액<", "</tr>"), "<td", "/td>");// Withdrawable balance
            this.iSASInOut.Output.Result.출금가능금액 = StrGrab(this.iSASInOut.Output.Result.출금가능금액, ">", "<");// // Remove ">" and "<"
            this.iSASInOut.Output.Result.출금가능금액 = this.iSASInOut.Output.Result.출금가능금액.replace(/[\s,]/g, ""); //Remove Space New Line and ,
            this.iSASInOut.Output.Result.출금가능금액 = StrTrim(this.iSASInOut.Output.Result.출금가능금액);// Remove Space New Line and , // Remove Space New Line and ,

            
            if (!IsCurrency(this.iSASInOut.Output.Result.잔액) || !IsCurrency(this.iSASInOut.Output.Result.출금가능금액)) {// If the balance or withdrawable amount is not a currency/
                this.setError(E_IBX_CURRENCY_NOT_CONVERT);
                return E_IBX_CURRENCY_NOT_CONVERT;
            }
        }
        

        // this.iSASInOut.Output.Result.대출약정금액 = StrGrab(StrGrab(ResultStr, ">대출약정금액<", "</tr>"), "<td", "/td>"); // Loan contract amount
        // this.iSASInOut.Output.Result.대출약정금액 = StrGrab(this.iSASInOut.Output.Result.대출약정금액, ">", "<"); // Remove ">" and "<"
        // this.iSASInOut.Output.Result.rawHTML = ResultStr; //Remove Space New Line and , // Remove Space New Line and ,
        this.iSASInOut.Output.Result.postData = this.postData
        return S_IBX_OK;
    } catch (e) {
        this.log("exception " + e.message);
        this.setError(E_IBX_UNKNOWN);
        return E_IBX_UNKNOWN;
    } finally {
        system.setStatus(IBXSTATE_DONE, 100);
        this.log(BankName + " Quick Inquiry Quick Balance Inquiry finally");
    }
};


///////////////////////////////////////////////////////////////////////////////////////////
//include 등등 필요한거 설정.
function OnInit() {
    console.log("OnInit()");
    try {
        //Load necessary components
        // system.include("iSASTypes");
        // system.include("sas/sas");

        // 2021.02.08
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
