/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*******************************************************************************
*  * Copyright (c) 2023 - Present Crowe LLP - All Rights Reserved.
*
* This software is the confidential and proprietary information of
* Crowe LLP. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered with Crowe LLp.
*
* FILE NAME: CSS UE Split PO.js
* DEVOPS TASK: BL/68139
* AUTHOR: Akash Sharma
* DATE CREATED: 20-Dec-2023
* DESCRIPTION: This is a supporting userevent script for Split PO Suitelet to add line-level link.
* REVISION HISTORY
* Date          DevOps          By
* ===============================================================================
*
********************************************************************************/
define(['N/runtime', 'N/url', 'N/ui/serverWidget', 'N/query', 'N/search', 'N/record'], (runtime, url, serverWidget, query, search, record) => {
    /**
     * Defines the function definition that is executed before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @since 2015.2
     */
    const beforeLoad = (scriptContext) => {
        try {
            var newRec = scriptContext.newRecord;
            var itemManager = newRec.getValue({ fieldId: 'employee' });
            if (itemManager && itemManager.length > 0) {
                var result = search.lookupFields({ type: 'employee', id: itemManager, columns: 'supervisor' });
                if (result.supervisor.length > 0) {
                    var supervisor = result.supervisor[0].value;
                    var purchaseRec = record.load({ type: 'purchaseorder', id: newRec.id });
                    var currentSupervisor = purchaseRec.getValue({ fieldId: 'custbody_c44319_item_manager_superviso' });
                    if (currentSupervisor != supervisor) {
                        purchaseRec.setValue({ fieldId: 'custbody_c44319_item_manager_superviso', value: supervisor });
                        purchaseRec.save();
                    }
                }
            }
            /**
             * Validating Event is View or not?
             */
            if (scriptContext.type !== scriptContext.UserEventType.VIEW) return;
            else log.debug("Passed Mode!");

            /**
             * Validating Current User is Item Manager or not?
             */
            // var userId = runtime.getCurrentUser().id;


            // if (itemManager != userId) return;
            // else log.debug("Passed Item Manager!");

            /**
            * Validating Current User is Admin or not?
            */
            var userRole = runtime.getCurrentUser().role;


            if (userRole != 3) return;
            else log.debug("Admin Condition Passed!");

            /**
             * Validating Current PO has a linked Project or not?
             */
            var project = newRec.getValue({ fieldId: 'custbody_c22699_project' });
            if (!project) return;
            else log.debug("Passed Project!");

            /**
             * Adding validation of Admin
             */
            var adminRole = Number(runtime.getCurrentUser().role);
            if (adminRole != 3) return;
            else log.debug("Admin Role Passed!");

            /**
             * Adding Sublist URL Field
             */
            var sublistField = scriptContext.form.getSublist({ id: 'item' });
            log.debug("JSON.stringify(runtime.envType)", JSON.stringify(runtime.envType));
            var accountId;
            // if (JSON.stringify(runtime.envType) !== "SANDBOX") {
            //     accountId = '5309025';
            // } else {
            accountId = '5309025_sb1';
            // }

            /**
             * Validating whether PO Can be splitted
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
            projectTaskQuery += "where custrecord_c22699_prp_related_po = " + newRec.id + " ";
            projectTaskQuery += "and custrecord_cadoe_22679_completed = 'T' ";
            projectTaskQuery += "and custrecord_c22679_related_vb is null and custrecord_c22679_related_ir is not null";

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
            prOtherTaskQuery += "where custrecord_c22699_prot_related_po = " + newRec.id + " ";
            prOtherTaskQuery += "and custrecord_c22679_prot_completed = 'T' ";
            prOtherTaskQuery += "and custrecord_c22679_prot_related_vb is null and custrecord_c22679_prot_related_ir is not null";

            var prOtherTask;


            if (prProjectTask.length <= 0) {
                prOtherTask = runSuiteQuery("prOtherTaskQuery", prOtherTaskQuery);
                if (prOtherTask.length <= 0) {
                    return;
                }
            }

            /**
             * Purchase order is under partial bill or unbilled status
             */
            var purchaseorderSearchObj = search.create({
                type: "purchaseorder",
                filters: [["type", "anyof", "PurchOrd"], "AND", ["status", "anyof", "PurchOrd:E", "PurchOrd:F"], "AND", ["mainline", "is", "T"], "AND", ["internalid", "anyof", newRec.id]],
                columns: [search.createColumn({ name: "internalid", sort: search.Sort.ASC, label: "Internal ID" })]
            });
            var searchResultCount = purchaseorderSearchObj.runPaged().count;

            if (searchResultCount != 1) return;
            else {
                /**
             * If all above conditions are met, then add a button for Split PO
             */

                scriptContext.form.clientScriptModulePath = "./CSS CS Split PO.js";
                scriptContext.form.addButton({ id: "custpage_split_po_button", label: "Split PO", functionName: "splitPO(" + newRec.id + ")" });
                log.debug("Added Buttons");
            }

        } catch (e) {
            log.error("Error Inside before Submit", e.message);
        }
    }

    /**
     * Defines the function definition that is executed before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const beforeSubmit = (scriptContext) => {


    }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {
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

    return { beforeLoad, beforeSubmit, afterSubmit }

});