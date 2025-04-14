/* jshint -W107 */
var moduleVersion = '0.0.1'; // Expected: string - Module version number
var BankName = 'kbstar'; // Expected: string - Name of the financial institution
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
    //TODO: 에러 메시지 가져오는 부분... // Part for retrieving error messages
    this.iSASInOut.Output.ErrorMessage = getCooconErrMsg(errcode.toString(16).toUpperCase());
};

///////////////////////////////////////////////////////////////////////////////
var 빠른조회 = function() { // Expected: string - Service class name for financial institution
    console.log(BankName + " 빠른조회 생성자 호출"); // Quick Inquiry constructor called
    this.errorMsg = "";
    this.host = 'https://obank.kbstar.com'; // Expected: string - Base URL of the service endpoint
    this.url = "";
    this.userAgent = "{}";
    this.param = "";
    this.postData = "";
    this.xgate_addr = "";
    this.bLogIn = false;
    this.formData = {};
};

빠른조회.prototype = Object.create(iSASObject.prototype);

빠른조회.prototype.빠른잔액조회 = function(aInput) { // Expected: string - Name of the operation to perform
    this.log(BankName + " 빠른조회 빠른잔액조회 호출 [" + aInput + "][" + moduleVersion + "]"); // Quick Inquiry Quick Balance Inquiry Call
    try {
        // <ST>WORKFLOW</SP>
        var input = dec(aInput.Input);

        var username = input.계좌번호;  // account number
        var password = input.계좌비밀번호; // account password
        var birthdate = input.주민사업자번호;

        system.setStatus(IBXSTATE_LOGIN, 30);
        // Step 1: Get the login page and capture the URL
        system.setStatus(IBXSTATE_LOGIN, 30);
        this.url = "/quics?page=C025255&cc=b028364:b028702&QSL=F";
        if (!httpRequest.get(this.host + this.url)) {
            this.setError(E_IBX_FAILTOGETPAGE);
            return E_IBX_FAILTOGETPAGE;
        }
        var ResultStr = httpRequest.result;
        this.log("Login Page URL: [" + this.host + this.url + "]");
        this.log("Login Page Content: [" + ResultStr.substring(0, 200) + "...]");

        // Step 2: Prepare form data for balance inquiry POST request
        system.setStatus(IBXSTATE_LOGIN, 40);
        this.postData = "";
        this.postData += "&" + httpRequest.URLEncode("요청키", "UTF-8") + "=" + httpRequest.URLEncode("", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("계좌번호", "UTF-8") + "=" + httpRequest.URLEncode(username, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회시작일자", "UTF-8") + "=" + httpRequest.URLEncode("20250413", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회종료일", "UTF-8") + "=" + httpRequest.URLEncode("20250413", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("고객식별번호", "UTF-8") + "=" + httpRequest.URLEncode("", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("빠른조회", "UTF-8") + "=" + httpRequest.URLEncode("Y", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회계좌", "UTF-8") + "=" + httpRequest.URLEncode(username, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("비밀번호", "UTF-8") + "=" + httpRequest.URLEncode(password, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("USEYN_CHECK_NAME_177760f95776", "UTF-8") + "=" + httpRequest.URLEncode("Y", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("검색구분", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("주민사업자번호", "UTF-8") + "=" + httpRequest.URLEncode(birthdate, "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회시작년", "UTF-8") + "=" + httpRequest.URLEncode("2025", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회시작월", "UTF-8") + "=" + httpRequest.URLEncode("04", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회시작일", "UTF-8") + "=" + httpRequest.URLEncode("13", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회끝년", "UTF-8") + "=" + httpRequest.URLEncode("2025", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회끝월", "UTF-8") + "=" + httpRequest.URLEncode("04", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회끝일", "UTF-8") + "=" + httpRequest.URLEncode("13", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("조회구분", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8");
        this.postData += "&" + httpRequest.URLEncode("응답방법", "UTF-8") + "=" + httpRequest.URLEncode("2", "UTF-8");

        // Step 3: Send POST request for balance inquiry
        this.url = "/quics?chgCompId=b028770&baseCompId=b028702&page=C025255&cc=b028702:b028770";
        if (!httpRequest.post(this.host + this.url, this.postData, "application/x-www-form-urlencoded")) {
            this.setError(E_IBX_FAILTOPOSTDATA);
            return E_IBX_FAILTOPOSTDATA;
        }

        // Step 4: Capture the response
        var currentUrl = this.host + this.url;
        ResultStr = httpRequest.result;
        this.log("Balance Inquiry Response URL: [" + currentUrl + "]");
        this.log("Balance Inquiry Response: [" + ResultStr.substring(0, 200) + "...]");
        
        system.setStatus(IBXSTATE_RESULT, 50);
        
        // Save the raw HTML to a file
        // try {
        //     // Create a file for writing
        //     var fso = new ActiveXObject("Scripting.FileSystemObject");
        //     var file = fso.CreateTextFile("kbstar_raw_html.txt", true);
        //     file.Write(ResultStr);
        //     file.Close();
        //     this.log("Raw HTML saved to kbstar_raw_html.txt");
        // } catch (e) {
        //     this.log("Error saving raw HTML: " + e.message);
            
        //     // Alternative method if ActiveXObject is not available
        //     try {
        //         system.saveToFile("kbstar_raw_html.txt", ResultStr);
        //         this.log("Raw HTML saved using system.saveToFile");
        //     } catch (e2) {
        //         this.log("Error using system.saveToFile: " + e2.message);
        //     }
        // }
        
        // <ST>DATA EXTRACTION</SP>
        // Prepare the output
        this.iSASInOut.Output = {};
        this.iSASInOut.Output.ErrorCode = "00000000";
        this.iSASInOut.Output.ErrorMessage = "";
        this.iSASInOut.Output.Result = {};

        // Store the request information
        this.iSASInOut.Output.Result.url = this.host + this.url;
        this.iSASInOut.Output.Result.postData = this.postData;
        // this.iSASInOut.Output.Result.rawHtml = ResultStr; // Store the raw HTML in the output

        // Extract account information from the result
        try {
            // Extract account information table
            var accountTable = StrGrab(ResultStr, '<table class="tType02 s5"', '</table>');
            
            // Extract account number and name
            var accountInfoRow = StrGrab(accountTable, '<tr class="first">', '</tr>');
            var accountInfo = StrGrab(accountInfoRow, '<td colspan="3">', '</td>').trim();
            this.iSASInOut.Output.Result.accountNumber = username; // From input
            this.iSASInOut.Output.Result.accountName = accountInfo;
            this.log("Account Info: " + accountInfo);
            
            // Extract balance (총잔액)
            var balanceRow = StrGrab(accountTable, '<th scope="row">총잔액</th>', '</tr>');
            var balance = StrGrab(balanceRow, '<td>', '</td>').trim();
            // Clean up the balance (remove commas and non-numeric characters)
            var cleanBalance = balance.replace(/[^0-9]/g, '');
            this.iSASInOut.Output.Result.balance = cleanBalance;
            this.iSASInOut.Output.Result.balanceFormatted = balance;
            this.log("Balance: " + balance + " (Cleaned: " + cleanBalance + ")");
            
            // Extract available balance (출금가능잔액)
            var availableBalance = StrGrab(balanceRow, '<th scope="row">출금가능잔액</th>', '</td>');
            availableBalance = StrGrab(availableBalance, '<td>', '').trim();
            // Clean up the available balance
            var cleanAvailableBalance = availableBalance.replace(/[^0-9]/g, '');
            this.iSASInOut.Output.Result.availableBalance = cleanAvailableBalance;
            this.iSASInOut.Output.Result.availableBalanceFormatted = availableBalance;
            this.log("Available Balance: " + availableBalance + " (Cleaned: " + cleanAvailableBalance + ")");
            
            // Extract loan and check amounts
            var otherAmountsRow = StrGrab(accountTable, '<th scope="row">대출약정금액', '</tr>');
            
            // Extract loan amount (대출약정금액)
            var loanAmount = StrGrab(otherAmountsRow, '<td>', '<br').trim();
            var cleanLoanAmount = loanAmount.replace(/[^0-9]/g, '');
            this.iSASInOut.Output.Result.loanAmount = cleanLoanAmount;
            this.log("Loan Amount: " + loanAmount + " (Cleaned: " + cleanLoanAmount + ")");
            
            // Extract loan expiry date (대출만료일)
            var loanExpiryDate = StrGrab(otherAmountsRow, '<br />', '</td>').trim();
            this.iSASInOut.Output.Result.loanExpiryDate = loanExpiryDate;
            this.log("Loan Expiry Date: " + loanExpiryDate);
            
            // Extract check amounts
            var checkAmountsSection = StrGrab(otherAmountsRow, '<th scope="row">자기앞수표금액', '</td>');
            var checkAmounts = StrGrab(checkAmountsSection, '<td>', '').trim();
            var checkAmountsParts = checkAmounts.split('<br />');
            
            // Extract cashier's check amount (자기앞수표금액)
            var cashiersCheckAmount = checkAmountsParts[0].trim();
            var cleanCashiersCheckAmount = cashiersCheckAmount.replace(/[^0-9]/g, '');
            this.iSASInOut.Output.Result.cashiersCheckAmount = cleanCashiersCheckAmount;
            this.log("Cashier's Check Amount: " + cashiersCheckAmount + " (Cleaned: " + cleanCashiersCheckAmount + ")");
            
            // Extract household check amount (가계수표금액)
            if (checkAmountsParts.length > 1) {
                var householdCheckAmount = checkAmountsParts[1].trim();
                var cleanHouseholdCheckAmount = householdCheckAmount.replace(/[^0-9]/g, '');
                this.iSASInOut.Output.Result.householdCheckAmount = cleanHouseholdCheckAmount;
                this.log("Household Check Amount: " + householdCheckAmount + " (Cleaned: " + cleanHouseholdCheckAmount + ")");
            }
            
            // Extract other amount (기타타점권금액)
            if (checkAmountsParts.length > 2) {
                var otherAmount = checkAmountsParts[2].trim();
                var cleanOtherAmount = otherAmount.replace(/[^0-9]/g, '');
                this.iSASInOut.Output.Result.otherAmount = cleanOtherAmount;
                this.log("Other Amount: " + otherAmount + " (Cleaned: " + cleanOtherAmount + ")");
            }
            
            // Extract transaction history
            var transactionTable = StrGrab(ResultStr, '<table class="tType01"', '</table>');
            if (transactionTable) {
                // Initialize transactions array
                this.iSASInOut.Output.Result.transactions = [];
                
                // Get transaction rows
                var transactionRows = transactionTable.split('<tr>');
                
                // Process each transaction row (skip the header rows)
                for (var i = 3; i < transactionRows.length; i++) {
                    var row = transactionRows[i];
                    
                    // Skip header rows
                    if (row.indexOf('거래일시') !== -1 || row.indexOf('구분') !== -1 || row.indexOf('내통장표시내용') !== -1) {
                        continue;
                    }
                    
                    try {
                        // Extract transaction date/time
                        var dateSection = StrGrab(row, '<td', '</td>');
                        var transactionDate = StrGrab(dateSection, '>', '<').trim();
                        if (transactionDate.indexOf('<br />') !== -1) {
                            transactionDate = transactionDate.replace('<br />', ' ');
                        }
                        
                        // Extract transaction description
                        var descriptionSection = StrGrab(row, dateSection + '</td>', '</td>');
                        var description = StrGrab(descriptionSection, '>', '<').trim();
                        
                        // Extract details (의뢰인/수취인)
                        var detailsRow = transactionRows[i+1]; // Details are in the next row
                        var details = "";
                        if (detailsRow && detailsRow.indexOf('<td>') !== -1) {
                            details = StrGrab(detailsRow, '<td>', '</td>').trim();
                        }
                        
                        // Extract withdrawal amount
                        var withdrawalSection = StrGrab(row, 'class="tRight">', '</td>');
                        var withdrawal = withdrawalSection.trim();
                        var cleanWithdrawal = withdrawal.replace(/[^0-9]/g, '');
                        
                        // Extract deposit amount
                        var depositSection = StrGrab(row, withdrawalSection + '</td>', 'class="tRight">');
                        var deposit = StrGrab(depositSection, '>', '<').trim();
                        var cleanDeposit = deposit.replace(/[^0-9]/g, '');
                        
                        // Extract balance after transaction
                        var balanceAfterSection = StrGrab(row, depositSection + '</td>', 'class="tRight">');
                        var balanceAfter = StrGrab(balanceAfterSection, '>', '<').trim();
                        var cleanBalanceAfter = balanceAfter.replace(/[^0-9]/g, '');
                        
                        // Extract transaction branch
                        var branchSection = StrGrab(row, balanceAfterSection + '</td>', '</td>');
                        var branch = StrGrab(branchSection, '>', '<').trim();
                        
                        // Add transaction to the array if it's a valid transaction
                        if (transactionDate) {
                            this.iSASInOut.Output.Result.transactions.push({
                                date: transactionDate,
                                description: description,
                                details: details,
                                withdrawal: cleanWithdrawal,
                                withdrawalFormatted: withdrawal,
                                deposit: cleanDeposit,
                                depositFormatted: deposit,
                                balanceAfter: cleanBalanceAfter,
                                balanceAfterFormatted: balanceAfter,
                                branch: branch
                            });
                            
                            this.log("Transaction: " + transactionDate + " - " + description + " - " + withdrawal + "/" + deposit + " - " + balanceAfter);
                        }
                        
                        // Skip the details row in the next iteration
                        i++;
                    } catch (e) {
                        this.log("Error processing transaction row: " + e.message);
                    }
                }
            }
        } catch (e) {
            this.log("Error in data extraction: " + e.message);
        }

        // Clean up any empty or undefined values
        for (var key in this.iSASInOut.Output.Result) {
            if (!this.iSASInOut.Output.Result[key]) {
                this.iSASInOut.Output.Result[key] = "";
            }
        }
        // <ST>DATA EXTRACTION</SP>
        return S_IBX_OK;
    } catch (e) {
        this.log("exception " + e.message);
        this.setError(E_IBX_UNKNOWN);
        return E_IBX_UNKNOWN;
    } finally {
        system.setStatus(IBXSTATE_DONE, 100);
        this.log(BankName + " Quick Inquiry Login finally");
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