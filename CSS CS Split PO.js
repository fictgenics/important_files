/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
/*******************************************************************************
*  * Copyright (c) 2023 - Present Crowe LLP - All Rights Reserved.
*
* This software is the confidential and proprietary information of
* Crowe LLP. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered with Crowe LLp.
*
* FILE NAME: CSS CS Split PO.js
* DEVOPS TASK: BL/68139
* AUTHOR: Akash Sharma
* DATE CREATED: 20-Dec-2023
* DESCRIPTION: This is a supporting client script for Split PO Suitelet.
* REVISION HISTORY
* Date          DevOps          By
* ===============================================================================
*
********************************************************************************/
define(['N/currentRecord', 'N/record', 'N/format', 'N/url', 'N/query', 'N/http', 'N/https', 'N/ui/message', 'N/query'],

    function (currentrecord, record, format, url, query, http, https, message, query) {
        var recobj;
        var mainAmount;
        var mainRate;
        var mainQty;
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(context) {
            console.log("Inside Pageinit");
            recobj = context.currentRecord;
            // mainAmount = recobj.getValue({ fieldId: 'custpage_amount' });
            // mainQty = recobj.getValue({ fieldId: 'custpage_quantity' });
            // mainRate = mainAmount / mainQty;

            // console.log("mainAmount", mainAmount);
            // console.log("mainQty", mainQty);

        }
        function fieldChanged(context) {
            var recobj = context.currentRecord;
            try {

                // var sublistName = context.sublistId;
                // var fieldName = context.fieldId;
                // var line = context.line;

                // /**
                //  * Validating Current Header Percetage to not be equal to 100
                //  */

                // if (fieldName == 'custpage_percent_h') {
                //     var totalPercentage = recobj.getValue({ fieldId: fieldName });

                //     if (totalPercentage && ((parseFloat(totalPercentage).toFixed(2) >= 100.00)) || (parseFloat(totalPercentage).toFixed(2) <= 0.99)) {
                //         recobj.setValue({ fieldId: fieldName, value: 1 });
                //         alert("This should be less then 100% or greater than 1%");
                //     }
                // }

                //         /**
                //          * Balances Quantity & Amount in First Sublist.
                //          */
                //         if (sublistName == 'custpage_sublist1' && fieldName == 'custpage_s1_quantity') {
                //             var lineVal = recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName });
                //             if (lineVal == 0) {
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: 0.01 });
                //                 alert("Quantity can't be 0.");
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: 0.01 });
                //             } else if (lineVal >= mainQty) {
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: 0.01 });
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custpage_s1_bill_amount', value: mainRate * 0.01 });
                //                 alert("Current Line Qty Matches to Header Quantity or is greater than that, split can't happen!");
                //             } else {
                //                 var lineVal = recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName });
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custpage_s1_bill_amount', value: mainRate * lineVal });
                //             }
                //         }

                //         if (sublistName == 'custpage_sublist1' && fieldName == 'custpage_s1_bill_amount') {
                //             var amtLineVal = recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName });
                //             if (amtLineVal == 0) {
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: mainRate / 2 });
                //             } else {
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custpage_s1_quantity', value: (amtLineVal / mainRate).toFixed(2) });
                //             }
                //         }

                //         /**
                //          * Balances Quantity & Amount in Second Sublist.
                //          */
                //         if (sublistName == 'custpage_sublist2' && fieldName == 'custpage_s2_quantity') {
                //             var lineVal = recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName });
                //             if (lineVal == 0) {
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: 0.01 });
                //                 alert("Quantity can't be 0.");
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: 0.01 });
                //             } else if (lineVal >= mainQty) {
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: 0.01 });
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custpage_s2_bill_amount', value: mainRate * 0.01 });
                //                 alert("Current Line Qty Matches to Header Quantity or is greater than that, split can't happen!");
                //             } else {
                //                 var lineVal = recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName });
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custpage_s2_bill_amount', value: mainRate * lineVal });
                //             }
                //         }

                //         /**
                //          * Default Project on First Sublist's Line should not be used on any other Line in Sublist 2
                //          */

                //         if (sublistName == 'custpage_sublist2' && fieldName == 'custpage_s2_project') {
                //             var projectVal = recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName });
                //             var headerProject = recobj.getValue({ fieldId: 'custpage_project' });
                //             if (projectVal == headerProject) {
                //                 alert("Selected project is the source project on PO, please use different project.");
                //                 recobj.setCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName, value: "" });
                //             }
                //         }

            }
            catch (e) {
                console.log('error ', e)
            }
        }
        // function validateField(context) {
        //     var recobj = context.currentRecord;
        //     try {

        //         var sublistName = context.sublistId;
        //         var fieldName = context.fieldId;
        //         var line = context.line;

        //         /**
        //          * First Sublist Line's Bill Date Can't be Prior to today.
        //          */
        //         console.log(sublistName, fieldName)
        //         var todayDate = formattingDate(new Date());
        //         if (sublistName == 'custpage_sublist1' && fieldName == 'custpage_s1_bill_date') {
        //             var billDateVal = formattingDate(recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName }))
        //             if (billDateVal.toLocaleDateString() < todayDate.toLocaleDateString()) {
        //                 alert("Bill Date can't be prior to Today's Date.");
        //                 recobj.setCurrentSublistText({ sublistId: sublistName, fieldId: fieldName, text: formattingDate() });
        //             }
        //         }

        //         /**
        //          * Second Sublist Line's Bill Date Can't be Prior to today.
        //          */

        //         if (sublistName == 'custpage_sublist2' && fieldName == 'custpage_s2_bill_date') {
        //             var billDateVal = formattingDate(recobj.getCurrentSublistValue({ sublistId: sublistName, fieldId: fieldName }))
        //             if (billDateVal.toLocaleDateString() < todayDate.toLocaleDateString()) {
        //                 alert("Bill Date can't be prior to Today's Date.");
        //                 recobj.setCurrentSublistText({ sublistId: sublistName, fieldId: fieldName, text: formattingDate() });
        //             }
        //         }
        //         return true;
        //     } catch (e) {
        //         console.log('error ', e)

        //     }
        // }

        function saveRecord(scriptContext) {

            /**
             * In this validation to be added for not allowing to save when sum of all line's % is other than 100.
             */
            var recobj = scriptContext.currentRecord;
            try {
                console.log('in saveRecord');
                var lineCnt2 = recobj.getLineCount({ sublistId: 'custpage_sublist2' });
                if (lineCnt2 <= 0) {
                    alert("Please add projects for split to work.");
                    return false;
                }
                var headerPercentage = parseFloat(0);


                for (var i = 0; i < lineCnt2; i++) {
                    headerPercentage += parseFloat(parseFloat(recobj.getSublistValue({ sublistId: 'custpage_sublist2', fieldId: 'custpage_s2_bill_percent', line: i })).toFixed(3));
                }

                if (headerPercentage == 100.000) {
                    alert("Please leave some percent for current PO's project too!");
                    return false;
                }

                return true;
            } catch (err) {
                console.log("Error inside saveRecord", err);
            }
        }


        function formattingDate(objDate) {
            try {
                console.log("before Format", objDate);
                if (objDate) {
                    objDate = format.parse({ type: format.Type.DATE, value: objDate });
                    console.log("After Format", objDate);
                } else {
                    objDate = format.format({ type: format.Type.DATE, value: new Date() });
                    console.log("After Format", objDate);
                }
                return objDate;
            } catch (e) {
                log.error("Error Inside formattingDate Function", e.message);
            }
        }

        function splitPO(poID) {
            try {
                var slUrl = url.resolveScript({ scriptId: 'customscript_c70737_su_split_po', deploymentId: 'customdeploy_c70737_su_split_po', isExternal: true });
                slUrl += "&poid=" + poID;
                window.open(slUrl);
            } catch (e) {
                log.error("Error Inside splitPO Function", e);
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            // validateField: validateField,
            splitPO: splitPO
        };

    });