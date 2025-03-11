/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
/*******************************************************************************
*  * Copyright (c) 2023 - Present Crowe LLP - All Rights Reserved.
*
* This software is the confidential and proprietary information of
* Crowe LLP. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered with Crowe LLp.
*
* FILE NAME: CSS SU Split PO.js
* DEVOPS TASK: BL/68139
* AUTHOR: Akash Sharma
* DATE CREATED: 20-Dec-2023
* DESCRIPTION: This is a suitelet for Split PO & Bills to multiple projects.
* REVISION HISTORY
* Date          DevOps          By
* ===============================================================================
*
********************************************************************************/
define(['N/ui/serverWidget', 'N/runtime', 'N/record', 'N/log', 'N/https', 'N/http', 'N/url', 'N/search', 'N/query', 'N/redirect', 'N/format'],

    function (serverWidget, runtime, record, log, https, http, url, search, query, redirect, format) {
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {Record} context.currentRecord - Current form record
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */

        function onRequest(context) {
            if (context.request.method === 'GET') {
                try {
                    log.debug("********Suitelet GET Started********");
                    var parameters = context.request.parameters;
                    log.debug("parameters", parameters);
                    var form = serverWidget.createForm({ title: 'Purchase Order Split' });

                    /**
                     * Loading PO & showing some details on header
                     */

                    var poId = parameters.poid || "";

                    var poField = form.addField({ id: 'custpage_purchase_order', type: serverWidget.FieldType.SELECT, label: 'Purchase Order', source: 'transaction' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    var vendorField = form.addField({ id: 'custpage_vendor', type: serverWidget.FieldType.SELECT, label: 'Vendor', source: 'vendor' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                    poField.defaultValue = poId;
                    var purchaseOrderRec = record.load({ type: 'purchaseorder', id: poId });

                    vendorField.defaultValue = purchaseOrderRec.getValue({ fieldId: 'entity' });

                    var vendorRec = record.load({ type: 'vendor', id: purchaseOrderRec.getValue({ fieldId: 'entity' }) });
                    var vendorLines = vendorRec.getLineCount({ sublistId: 'submachine' });
                    var allSubsidiary = [];
                    for (var i = 0; i < vendorLines; i++) {
                        allSubsidiary.push(Number(vendorRec.getSublistValue({ sublistId: 'submachine', fieldId: 'subsidiary', line: i })));
                    }


                    var totalAmountField = form.addField({ id: 'custpage_total_amount_h', type: serverWidget.FieldType.FLOAT, label: 'Total Amount' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    var currentUsablePercentField = form.addField({ id: 'custpage_usable_per_fld', type: serverWidget.FieldType.FLOAT, label: 'Current Usable Percent' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    /**
                     * Long Text Field for Storing MileStone List
                     */

                    var milestoneListField = form.addField({ id: 'custpage_milestone_list', type: serverWidget.FieldType.LONGTEXT, label: 'Milestone List' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    var milestoneTypeField = form.addField({ id: 'custpage_milestone_type', type: serverWidget.FieldType.TEXT, label: 'Milestone Type' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });



                    /**
                     * Adding Sublist 1 for Static Details that already exists on Purchase Order
                     */

                    var projectTaskFlag = true;
                    var projectTaskQuery = "select id, ";
                    projectTaskQuery += "custrecord_c22699_prp_line_number as linenum, ";
                    projectTaskQuery += "custrecord_c22679_related_ir as relatedir, ";
                    projectTaskQuery += "custrecord_cadoe_22679_completed as completed, ";
                    projectTaskQuery += "custrecord_c22699_act_code as acode, ";
                    projectTaskQuery += "custrecord_c22679_related_vb as relatedvb, ";
                    projectTaskQuery += "custrecord_c_milestone as milestone, ";
                    projectTaskQuery += "custrecord_c_milestone as msid, ";
                    projectTaskQuery += "custrecord_cf_due_date as duedate, ";
                    projectTaskQuery += "custrecord_c22699_prp_gross_amt as amount, ";
                    projectTaskQuery += "custrecord_c_payment as paypercent ";
                    projectTaskQuery += "from customrecord_c_pr_project ";
                    projectTaskQuery += "where custrecord_c22699_prp_related_po = " + poId + " ";
                    projectTaskQuery += "and custrecord_cadoe_22679_completed = 'T' ";
                    projectTaskQuery += "and custrecord_c22679_related_vb is null and custrecord_c22679_related_ir is not null order by custrecord_c22699_prp_line_number asc";

                    var prProjectTask = runSuiteQuery("projectTaskQuery", projectTaskQuery);

                    var prOtherTaskQuery = "select id, ";
                    prOtherTaskQuery += "custrecord_c22699_prot_line_number as linenum, ";
                    prOtherTaskQuery += "custrecord_c22679_prot_related_ir as relatedir, ";
                    prOtherTaskQuery += "custrecord_c22679_prot_completed as completed, ";
                    prOtherTaskQuery += "custrecord_c22699_prot_act_code as acode, ";
                    prOtherTaskQuery += "custrecord_c22679_prot_related_vb as relatedvb, ";
                    prOtherTaskQuery += "custrecord_c22699_prot_task as milestone, ";
                    prOtherTaskQuery += "custrecord_c22699_prot_cf_due_date as duedate, ";
                    prOtherTaskQuery += "custrecord_c22699_prot_gross_amt as amount, ";
                    prOtherTaskQuery += "custrecord_c22699_prot_pmt_percent as paypercent ";
                    prOtherTaskQuery += "from customrecord_c22699_pr_other_task ";
                    prOtherTaskQuery += "where custrecord_c22699_prot_related_po = " + poId + " ";
                    prOtherTaskQuery += "and custrecord_c22679_prot_completed = 'T' ";
                    prOtherTaskQuery += "and custrecord_c22679_prot_related_vb is null and custrecord_c22679_prot_related_ir is not null order by custrecord_c22699_prot_line_number asc";

                    var prOtherTask;
                    var taskType;
                    var milestoneArr = [];

                    if (prProjectTask.length <= 0) {
                        prOtherTask = runSuiteQuery("prOtherTaskQuery", prOtherTaskQuery);
                        projectTaskFlag = false;

                        if (prOtherTask.length > 0) {
                            taskType = "ot";
                            for (var j = 0; j < prOtherTask.length; j++) {
                                milestoneArr.push(prOtherTask[j]['id']);
                            }
                        }
                    } else {
                        taskType = "pt";
                        for (var j = 0; j < prProjectTask.length; j++) {
                            milestoneArr.push(prProjectTask[j]['id']);
                        }
                    }

                    milestoneListField.defaultValue = String(milestoneArr);
                    milestoneTypeField.defaultValue = String(taskType);

                    log.debug("taskType", taskType);

                    form.addSubtab({ id: 'custpage_entry_tab1', label: 'Data Insert' });
                    var sublist1 = form.addSublist({ id: 'custpage_sublist1', type: serverWidget.SublistType.LIST, label: 'Main Sublist', tab: 'custpage_entry_tab1' });
                    var lineSublist1 = sublist1.addField({ id: 'custpage_s1_line', type: serverWidget.FieldType.INTEGER, label: 'Line', }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); //HIDDEN LATER
                    var projectSublist1 = sublist1.addField({ id: 'custpage_s1_project', type: serverWidget.FieldType.SELECT, label: 'Project', source: 'job' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    var itemSublist1 = sublist1.addField({ id: 'custpage_s1_item', type: serverWidget.FieldType.SELECT, label: 'Item', source: 'item' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    var quantitySublist1 = sublist1.addField({ id: 'custpage_s1_quantity', type: serverWidget.FieldType.FLOAT, label: 'Quantity' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    var percentSublist1 = sublist1.addField({ id: 'custpage_s1_percent', type: serverWidget.FieldType.PERCENT, label: 'Quantity' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    var billAmountSublist1 = sublist1.addField({ id: 'custpage_s1_bill_amount', type: serverWidget.FieldType.CURRENCY, label: 'Bill Rate' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    var billGrossAmountSublist1 = sublist1.addField({ id: 'custpage_s1_bill_g_amount', type: serverWidget.FieldType.CURRENCY, label: 'Bill Amount' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                    /**
                     * Setting Line Data for Static List from Purchase Order Record
                     */

                    var poLineCount = purchaseOrderRec.getLineCount({ sublistId: 'item' });

                    var totalSumLineAmount = parseFloat(0);
                    if (poLineCount > 0) {
                        for (var iter = 0; iter < poLineCount; iter++) {
                            var lineNum = Number(purchaseOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_c22699_line_number', line: iter }));

                            var currentLineItem = Number(purchaseOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: iter }));
                            var currentLineProject = Number(purchaseOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'customer', line: iter }));
                            var currentLineQty = purchaseOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: iter });
                            var currentLineRate = purchaseOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: iter });
                            var currentLineGrossAmount = purchaseOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: iter });


                            var currentLineUsablePercentage = 0.0;
                            if (taskType == 'pt') {
                                log.debug("Inside Project Task");
                                for (var x = 0; x < prProjectTask.length; x++) {
                                    log.debug("Index Inside is: " + x, "prProjectTask length: " + prProjectTask.length + " || prProjectTask[x]['linenum']: " + prProjectTask[x]['linenum']);
                                    var mileStoneLineNum = Number(prProjectTask[x]['linenum']);
                                    log.debug("mileStoneLineNum", mileStoneLineNum);
                                    log.debug("lineNum", lineNum);
                                    if (mileStoneLineNum == lineNum) {
                                        currentLineUsablePercentage += parseFloat(prProjectTask[x]['paypercent']);
                                    } else if (mileStoneLineNum > lineNum) {
                                        log.debug("Break");
                                        break;
                                    }
                                }
                                currentUsablePercentField.defaultValue = currentLineUsablePercentage;
                            } else if (taskType == 'ot') {
                                log.debug("Inside Other Task");
                                for (var x = 0; x < prOtherTask.length; x++) {
                                    log.debug("Index Inside is: " + x, "prOtherTask length: " + prOtherTask.length + " || prOtherTask[x]['linenum']: " + prOtherTask[x]['linenum']);
                                    var mileStoneLineNum = Number(prOtherTask[x]['linenum']);
                                    log.debug("mileStoneLineNum", mileStoneLineNum);
                                    log.debug("lineNum", lineNum);
                                    if (mileStoneLineNum == lineNum) {
                                        currentLineUsablePercentage += parseFloat(prOtherTask[x]['paypercent']);
                                    } else if (mileStoneLineNum > lineNum) {
                                        log.debug("Break");
                                        break;
                                    }
                                }
                            }
                            log.debug("currentLineUsablePercentage: " + currentLineUsablePercentage, "Qty: " + parseFloat(currentLineQty * currentLineUsablePercentage).toFixed(3));
                            if (currentLineUsablePercentage > 0) {
                                sublist1.setSublistValue({ id: 'custpage_s1_quantity', line: iter, value: parseFloat(currentLineQty * currentLineUsablePercentage).toFixed(3) });
                                sublist1.setSublistValue({ id: 'custpage_s1_percent', line: iter, value: currentLineUsablePercentage });

                                sublist1.setSublistValue({ id: 'custpage_s1_project', line: iter, value: currentLineProject });
                                sublist1.setSublistValue({ id: 'custpage_s1_item', line: iter, value: currentLineItem });

                                log.debug("Index is: " + iter, "lineNum: " + lineNum + " || currentLineQty: " + currentLineQty);

                                sublist1.setSublistValue({ id: 'custpage_s1_line', line: iter, value: lineNum.toFixed(0) });
                                totalSumLineAmount += parseFloat((parseFloat(currentLineRate) * parseFloat(currentLineUsablePercentage)).toFixed(3));
                                sublist1.setSublistValue({ id: 'custpage_s1_bill_amount', line: iter, value: parseFloat(currentLineRate * currentLineUsablePercentage).toFixed(3) });
                                sublist1.setSublistValue({ id: 'custpage_s1_bill_g_amount', line: iter, value: parseFloat(currentLineGrossAmount * currentLineUsablePercentage).toFixed(3) });

                            }
                        }
                    }

                    totalAmountField.defaultValue = totalSumLineAmount;

                    // Sublist 2
                    var sublist2 = form.addSublist({ id: 'custpage_sublist2', type: serverWidget.SublistType.INLINEEDITOR, label: 'Sub Sublist', tab: 'custpage_entry_tab1' });
                    var projectList = sublist2.addField({ id: 'custpage_s2_project', type: serverWidget.FieldType.SELECT, label: 'Project', source: [] });
                    buildSourceList(projectList, allSubsidiary);
                    // projectList.isMandatory = true;
                    sublist2.addField({ id: 'custpage_s2_bill_date', type: serverWidget.FieldType.DATE, label: 'Bill Date' }).isMandatory = true;
                    sublist2.addField({ id: 'custpage_s2_bill_percent', type: serverWidget.FieldType.FLOAT, label: 'Bill Percent' }).isMandatory = true;
                    form.addSubmitButton({ label: 'Split' });
                    form.clientScriptFileId = getfileId('CSS CS Split PO.js');
                    context.response.writePage(form);

                }
                catch (err) {
                    log.error("error in if of showingProjecttaskList is", err);
                }
            } else {
                try {
                    log.debug("********Suitelet POST Started********");

                    /**
                     * Getting All parameters
                     */
                    var params = context.request;
                    // log.debug("Parameters", params.parameters);

                    var currentUsablePercentValue = params.parameters.custpage_usable_per_fld;
                    /**
                     * We need to remove lines other then the one utlised to not transform.
                     * So create an array of all line Numbers & keep the by index of & remove all other. 
                     */

                    var itemCount1 = context.request.getLineCount({ group: 'custpage_sublist1' });
                    // log.debug("itemCount1", itemCount1);

                    var lineIdArr = {};
                    if (itemCount1 > 0) {
                        for (var i = 0; i < itemCount1; i++) {
                            var lineId = params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_line', line: i });
                            var qtyPerc = params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_percent', line: i });
                            lineIdArr[Number(lineId)] = qtyPerc;
                        }
                    }
                    log.debug("lineIdArr", lineIdArr);

                    /**
                     * Now Removing all lines from Transformed PO to Vendor Bill except array values
                     */

                    var poId = params.parameters.custpage_purchase_order;
                    if (!poId) {
                        log.debug("No PO Id Found!");
                        return;
                    }
                    // else log.debug("poId", poId);

                    var purchOrdRec = record.load({ type: 'purchaseorder', id: poId });

                    var vendorBillRec = record.transform({ fromType: record.Type.PURCHASE_ORDER, fromId: poId, toType: record.Type.VENDOR_BILL });

                    /**
                     * Removing Line by iterating in reverse order to avoid issues while line number changes(only when line count is more than 1)
                     */

                    var currentTaxCode;

                    var vendorLineCount;
                    if (itemCount1 > 0) {
                        var lineIds = Object.keys(lineIdArr);
                        vendorLineCount = vendorBillRec.getLineCount({ sublistId: 'item' });
                        for (var i = vendorLineCount - 1; i >= 0; i--) {
                            var currentLineNum = Number(vendorBillRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_c22699_line_number', line: i }));
                            log.debug("currentLineNum", currentLineNum);

                            var currentPoLine = (purchOrdRec.findSublistLineWithValue({ sublistId: 'item', fieldId: 'custcol_c22699_line_number', value: currentLineNum }));
                            log.debug("currentPoLine", currentPoLine);
                            var currentLineQty = purchOrdRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: currentPoLine });
                            log.debug("currentLineQty", currentLineQty);
                            log.debug('lineIdArr' + (currentLineNum), lineIdArr[currentLineNum])
                            if (lineIds.indexOf(Number(currentLineNum)) == -1 && lineIds.indexOf((currentLineNum).toString()) == -1) {
                                vendorBillRec.removeLine({ sublistId: 'item', line: i });
                            } else {
                                vendorBillRec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i, value: (parseFloat(parseFloat(currentLineQty) * parseFloat(lineIdArr[currentLineNum]))).toFixed(3) });
                                vendorBillRec.setSublistValue({ sublistId: 'item', fieldId: 'description', line: i, value: "Test" });
                                vendorBillRec.setSublistValue({ sublistId: 'item', fieldId: 'customer', line: i, value: vendorBillRec.getValue({ fieldId: 'custbody_c22699_project' }) });
                            }
                        }
                        vendorLineCount = vendorBillRec.getLineCount({ sublistId: 'item' });
                        currentTaxCode = vendorBillRec.getSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: 0 });
                        log.debug("Line Count after remove", vendorLineCount);
                    }

                    /**
                     * Updating Details of Bill to be transformed
                     */

                    var savedVendorBillId = vendorBillRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    log.debug("savedVendorBillId", savedVendorBillId);

                    /**
                     * Now attaching Vendor Bill on Utilised Milestones
                     */

                    var task = params.parameters.custpage_milestone_type;
                    var taskList = params.parameters.custpage_milestone_list;
                    if (taskList) taskList = String(taskList).split(",");
                    log.debug("task: " + task, "taskList: " + taskList);

                    if (savedVendorBillId && taskList.length > 0) {
                        log.debug("New Task List", taskList);

                        var recordType;
                        var relatedVendorBill;

                        if (String(task) == 'ot') {
                            record.submitFields({ type: 'vendorbill', id: savedVendorBillId, values: { 'custbody_c22679_other_milestones_paid': taskList } });
                        } else if (String(task) == 'pt') {
                            record.submitFields({ type: 'vendorbill', id: savedVendorBillId, values: { 'custbody_c22679_pr_milestones_paid': taskList } });
                        }

                        for (var k = 0; k < taskList.length; k++) {
                            log.debug("For iter k: " + k, "recordType: " + recordType + " || taskList[k]: " + taskList[k] + " || relatedVendorBill: " + relatedVendorBill + " || savedVendorBillId: " + savedVendorBillId);
                            if (String(task) == 'ot') {
                                record.submitFields({ type: 'customrecord_c22699_pr_other_task', id: taskList[k], values: { 'custrecord_c22679_prot_related_vb': savedVendorBillId } });
                            } else if (String(task) == 'pt') {
                                record.submitFields({ type: 'customrecord_c_pr_project', id: taskList[k], values: { 'custrecord_c22679_related_vb': savedVendorBillId } });
                            }
                        }


                        /**
                         * Now creating Bill Credit for Amount = PO Total Amount - Bill Amount of First Line on Suitelet
                         */
                        var itemCount2 = context.request.getLineCount({ group: 'custpage_sublist2' });
                        log.debug("itemCount2", itemCount2);

                        var linePercent = parseFloat(0);
                        var totalAmount = params.parameters.custpage_total_amount_h;
                        if (itemCount2 > 0) {
                            for (var ab = 0; ab < itemCount2; ab++) {
                                var currentLinePercentage = parseFloat(params.getSublistValue({ group: 'custpage_sublist2', name: 'custpage_s2_bill_percent', line: ab }));
                                log.debug("currentLinePercentage", currentLinePercentage);
                                linePercent += parseFloat(currentLinePercentage.toFixed(3));
                                log.debug("Line Percent after ab: " + ab, "linePercent: " + linePercent);
                            }
                        }
                        linePercent = linePercent.toFixed(3);
                        log.debug("linePercent", linePercent);

                        var vendorCreditRec = record.transform({ fromType: record.Type.VENDOR_BILL, fromId: savedVendorBillId, toType: record.Type.VENDOR_CREDIT });
                        var vendorCreditLineCount = vendorCreditRec.getLineCount({ sublistId: 'item' });
                        log.debug("vendorCreditLineCount", vendorCreditLineCount);

                        if (vendorCreditLineCount > 0) {
                            for (var l = 0; l < vendorCreditLineCount; l++) {
                                var totalLineAmount = parseFloat(params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_bill_amount', line: l }));
                                vendorCreditRec.setSublistValue({ sublistId: 'item', fieldId: 'amount', value: parseFloat(totalLineAmount * (linePercent / 100)).toFixed(3), line: l });
                                vendorCreditRec.setSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: currentTaxCode, line: l });
                                vendorCreditRec.setSublistValue({ sublistId: 'item', fieldId: 'location', value: vendorBillRec.getSublistValue({ sublistId: 'item', fieldId: 'location', line: 0 }), line: l });
                            }
                            var vendBillLineId = vendorCreditRec.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'doc', value: savedVendorBillId });
                            log.debug('vendBillLineId', vendBillLineId);
                            vendorCreditRec.setSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, line: vendBillLineId });
                        }
                        var savedVendorCredit = vendorCreditRec.save({ enableSourcing: false, ignoreMandatoryFields: true });
                        log.debug("savedVendorCredit", savedVendorCredit);
                    }

                    /**
                     * Getting Lines Inserted & calculating percentage on that basis
                     */
                    var vendorVal = params.parameters.custpage_vendor;

                    if (itemCount2 > 0) {
                        for (var j = 0; j < itemCount2; j++) {
                            // var qty2 = params.getSublistValue({ group: 'custpage_sublist2', name: 'custpage_s2_quantity', line: j });
                            var bd2 = params.getSublistValue({ group: 'custpage_sublist2', name: 'custpage_s2_bill_date', line: j });
                            // var am2 = params.getSublistValue({ group: 'custpage_sublist2', name: 'custpage_s2_bill_amount', line: j });
                            var percent2 = params.getSublistValue({ group: 'custpage_sublist2', name: 'custpage_s2_bill_percent', line: j });
                            var prj2 = params.getSublistValue({ group: 'custpage_sublist2', name: 'custpage_s2_project', line: j });


                            log.debug("DEBUG1: ", " || bd2: " + bd2 + " || percent2: " + percent2 + " || prj2: " + prj2);

                            /**
                             * Creating Vendor Bill
                             */

                            if (itemCount1 > 0) {
                                log.debug("itemCount1", itemCount1);
                                var vendorBillRec2 = record.create({ type: record.Type.VENDOR_BILL });
                                vendorBillRec2.setValue({ fieldId: 'entity', value: vendorVal });
                                vendorBillRec2.setValue({ fieldId: 'custbody_c22699_project', value: prj2 });
                                /**
                                 * Getting Project Subsidiary & Setting on Bill
                                 */

                                if (prj2) {
                                    var fieldLookup = search.lookupFields({ type: 'job', id: prj2, columns: ['subsidiary'] });
                                    var projectSubsidiary = fieldLookup.subsidiary;
                                    if (projectSubsidiary.length > 0) {
                                        projectSubsidiary = projectSubsidiary[0].value;
                                        vendorBillRec2.setValue({ fieldId: 'subsidiary', value: Number(projectSubsidiary) });
                                    }
                                }

                                vendorBillRec2.setValue({ fieldId: 'trandate', value: parsingDate(bd2) });
                                vendorBillRec2.setValue({ fieldId: 'duedate', value: parsingDate(bd2) });
                                vendorBillRec2.setValue({ fieldId: 'custbody_c70737_splitted_from_po', value: Number(poId) });

                                for (var z = 0; z < itemCount1; z++) {
                                    var itemLineSub1 = params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_item', line: z });

                                    var amountLineSub1 = params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_bill_amount', line: z });
                                    var quantityLineSub1 = params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_quantity', line: z });

                                    log.debug("DEBUG", "amountLineSub1: " + amountLineSub1 + " || quantityLineSub1: " + quantityLineSub1);
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'item', line: z, value: Number(itemLineSub1) });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: z, value: (parseFloat(quantityLineSub1) * parseFloat(percent2 / 100)).toFixed(3) });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'amount', line: z, value: (parseFloat(amountLineSub1) * parseFloat(percent2 / 100)).toFixed(3) });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'customer', line: z, value: prj2 });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'description', line: z, value: "Test" });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'taxcode', line: z, value: currentTaxCode });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'location', line: z, value: vendorBillRec.getSublistValue({ sublistId: 'item', fieldId: 'location', line: z }) });
                                    vendorBillRec2.setSublistValue({ sublistId: 'item', fieldId: 'cseg_paactivitycode', line: z, value: vendorBillRec.getSublistValue({ sublistId: 'item', fieldId: 'cseg_paactivitycode', line: z }) });

                                }
                                var savedVendorBillRec2 = vendorBillRec2.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                log.debug("savedVendorBillRec2", savedVendorBillRec2);

                                /**
                                * Creating PR/Other Task
                                */

                                for (var y = 0; y < itemCount1; y++) {
                                    var amountLineSub1 = params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_bill_amount', line: y });

                                    var prOtherTask = record.create({ type: 'customrecord_c22699_pr_other_task' });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_line_number', value: params.getSublistValue({ group: 'custpage_sublist1', name: 'custpage_s1_line', line: y }) });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_pmt_percent', value: "100" });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_due_date', value: parsingDate(bd2) });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_amount', value: (parseFloat(amountLineSub1) * parseFloat(percent2 / 100)).toFixed(3) });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_related_project', value: prj2 });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22679_prot_related_vb', value: savedVendorBillRec2 });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22679_prot_completed', value: true });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_act_code', value: vendorBillRec.getSublistValue({ sublistId: 'item', fieldId: 'cseg_paactivitycode', line: y }) });
                                    prOtherTask.setValue({ fieldId: 'custrecord_c22699_prot_cf_due_date', value: parsingDate(bd2) });
                                    var savedPrOtherTask = prOtherTask.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                    log.debug("savedPrOtherTask Z Index is: " + z + "|| Y Index is: " + y, savedPrOtherTask);
                                }
                            }
                        }
                    }

                    redirect.toRecord({ id: poId, type: 'purchaseorder', isEditMode: false });
                }
                catch (e) {
                    log.error('Error in POST', e)
                }
            }
        }

        function buildSourceList(fieldVal, allSubsidiary) {
            fieldVal.addSelectOption({
                value: "",
                text: ""
            });
            var jobSearchObj = search.create({
                type: "job",
                filters: [["status", "noneof", "30", "37", "-2"], "AND", ["isinactive", "is", "F"], "AND", ["subsidiary", "anyof", allSubsidiary]],
                columns: [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "companyname", sort: search.Sort.ASC, label: "Project Name" })
                ]
            });

            var searchResultCount = jobSearchObj.runPaged().count;
            log.debug("jobSearchObj result count", searchResultCount);
            jobSearchObj.run().each(function (result) {
                fieldVal.addSelectOption({
                    value: result.getValue({ name: "internalid", label: "Internal ID" }),
                    text: result.getValue({ name: "companyname", sort: search.Sort.ASC, label: "Project Name" })
                });
                return true;
            });
            fieldVal.isMandatory = true;
            fieldVal.defaultValue = "";
        }

        function formattingDate(objDate) {
            try {

                objDate = format.parse({ type: format.Type.DATE, value: objDate });
                log.debug("After Format", objDate);
                objDate = format.format({ type: format.Type.DATE, value: objDate });
                log.debug("After Parse", objDate);

                return objDate;
            } catch (e) {
                log.error("Error Inside formattingDate Function", e.message);
            }
        }
        function parsingDate(objDate) {
            try {

                objDate = format.parse({ type: format.Type.DATE, value: objDate });
                log.debug("After Parse", objDate);
                return objDate;
            } catch (e) {
                log.error("Error Inside formattingDate Function", e.message);
            }
        }

        function runSuiteQuery(queryName, queryString) {
            log.debug("Query String For : " + queryName + "->", queryString);
            var resultSet = query.runSuiteQL({ query: queryString });
            log.debug("Query Mapped Data For : " + queryName + "->", resultSet.asMappedResults());
            if (resultSet && resultSet.results && resultSet.results.length > 0) {
                return resultSet.asMappedResults();
            } else {
                return [];
            }
        }

        function getfileId(clientScript) {
            //we can make it as function to reuse.
            var search_folder = search.create({
                type: 'folder',
                filters: [{
                    name: 'name',
                    join: 'file',
                    operator: 'is',
                    values: clientScript
                }],
                columns: [{
                    name: 'internalid',
                    join: 'file',
                }]
            });
            var searchFolderId = '';
            var searchFolderName = '';
            search_folder.run().each(function (result) {
                searchFolderId = result.getValue({
                    name: 'internalid',
                    join: 'file'
                });
                log.debug('searchFolderId', searchFolderId);
                return true;
            });
            return searchFolderId;
        }

        return {
            onRequest: onRequest
        };

    });