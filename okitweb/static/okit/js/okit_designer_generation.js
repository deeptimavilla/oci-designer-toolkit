/*
** Copyright (c) 2020, Oracle and/or its affiliates.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
console.info('Loaded Generation Javascript');

function validationFailedNotification() {
    $('#toggle_validation_button').removeClass('okit-bar-panel-displayed');
    $('#toggle_validation_button').click();
    alert('Model Validation Failed. \nSee Validation Pane for results.')
}

/*
** Generate Button handlers
 */

function saveZip(url, filename="") {
    let a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
}

function handleGenerateTerraformOption(e) {
    $(jqId('modal_dialog_title')).text('Export Terraform');
    $(jqId('modal_dialog_body')).empty();
    $(jqId('modal_dialog_footer')).empty();
    let table = d3.select(d3Id('modal_dialog_body')).append('div').append('div')
        .attr('id', 'load_from_git')
        .attr('class', 'table okit-table okit-modal-dialog-table');
    let tbody = table.append('div').attr('class', 'tbody');
    let tr = tbody.append('div').attr('class', 'tr');
    tr.append('div').attr('class', 'td').text('Destination:');

    div = tr.append('div')
        .attr('class', 'okit-horizontal-radio');
    div.append('input')
        .attr('type','radio')
        .attr('id', 'export_terraform_local')
        .attr('name', 'export_terraform_name')
        .attr('value', 'LOCAL')
        .attr('checked', 'checked')
        .on('change', () => {
            $(jqId('export_box_repo')).addClass('collapsed');
            $(jqId('export_box_filename')).addClass('collapsed');
            $(jqId('export_box_commitmsg')).addClass('collapsed');
        });
    div.append('label')
        .attr('for', 'export_terraform_local')
        .text('Local');
    // Apply
    div.append('input')
        .attr('type','radio')
        .attr('id', 'export_terraform_repo')
        .attr('name', 'export_terraform_name')
        .attr('value', 'GITREPO')
        .on('change', () => {
            $(jqId('export_box_repo')).removeClass('collapsed');
            $(jqId('export_box_filename')).removeClass('collapsed');
            $(jqId('export_box_commitmsg')).removeClass('collapsed');
        });
    div.append('label')
        .attr('for', 'export_terraform_repo')
        .text('Git');


    tr = tbody.append('div').attr('class', 'tr collapsed').attr('id', 'export_box_repo');
    tr.append('div').attr('class', 'td').text('Repository:');
    tr.append('div').attr('class', 'td').append('select')
        .attr('id', 'git_repository')
        .append('option')
        .attr('value', 'select')
        .text('Select');

    let git_repository_filename_select = d3.select(d3Id('git_repository'));

    for (let git_setting of okitOciConfig.settings) {
        git_repository_filename_select.append('option').attr('value', git_setting['url']+'*'+git_setting['branch']).text(git_setting['label']);
    }

    tr = tbody.append('div').attr('class', 'tr collapsed').attr('id', 'export_box_filename');
    tr.append('div').attr('class', 'td').text('Folder Name:');
    tr.append('div').attr('class', 'td').append('input')
        .attr('class', 'okit-input')
        .attr('id', 'git_repository_filename')
        .attr('type', 'text');

    tr = tbody.append('div').attr('class', 'tr collapsed').attr('id', 'export_box_commitmsg');
    tr.append('div').attr('class', 'td').text('Description:');
    tr.append('div').attr('class', 'td').append('input')
        .attr('class', 'okit-input')
        .attr('id', 'git_repository_commitmsg')
        .attr('type', 'text');

    // Submit
    let save_button = d3.select(d3Id('modal_dialog_footer')).append('div').append('button')
        .attr('id', 'export_terraform_option_id')
        .attr('type', 'button')
        .text('Submit');
    save_button.on("click", handleGenerateTerraformOptionProceed);
    $(jqId('modal_dialog_wrapper')).removeClass('hidden');
}
function handleGenerateTerraformOptionProceed(e) {
    okitJsonModel.export_terraform_name = $('input[name=export_terraform_name]:checked').val();
    if (okitJsonModel.export_terraform_name == 'LOCAL') {
        handleGenerateTerraform()
        $(jqId('modal_dialog_wrapper')).addClass('hidden');
    } else {
        okitJsonModel.git_repository = $(jqId('git_repository')).val();
        okitJsonModel.git_repository_filename = $(jqId('git_repository_filename')).val();
        okitJsonModel.git_repository_commitmsg = $(jqId('git_repository_commitmsg')).val();

        hideNavMenu();
        okitJsonModel.validate(generateTerraformToRepo);
    }
}
function generateTerraformToRepo(results) {
    if (results.valid) {
        let requestJson = JSON.parse(JSON.stringify(okitJsonModel));
        console.info(okitSettings);
        requestJson.use_variables = okitSettings.is_variables;
        $.ajax({
            type: 'post',
            url: 'generate/terraformtogit',
            dataType: 'text',
            contentType: 'application/json',
            data: JSON.stringify(requestJson),
            success: function(resp) {
                console.info('Response : ' + resp);
                $(jqId('modal_dialog_wrapper')).addClass('hidden');
                alert(resp);
            },
            error: function(xhr, status, error) {
                console.info('Status : '+ status)
                console.info('Error : '+ error)
            }
        });
    } else {
        validationFailedNotification();
    }
}
function handleGenerateTerraform(e) {
    hideNavMenu();
    okitJsonModel.validate(generateTerraform);
}
function generateTerraform(results) {
    if (results.valid) {
        let requestJson = JSON.parse(JSON.stringify(okitJsonModel));
        console.info(okitSettings);
        requestJson.use_variables = okitSettings.is_variables;
        $.ajax({
            type: 'post',
            url: 'generate/terraform',
            dataType: 'text',
            contentType: 'application/json',
            data: JSON.stringify(requestJson),
            success: function(resp) {
                console.info('Response : ' + resp);
                saveZip('generate/terraform');
            },
            error: function(xhr, status, error) {
                console.info('Status : '+ status)
                console.info('Error : '+ error)
            }
        });
    } else {
        validationFailedNotification();
    }
}
function handleGenerateAnsibleOption(e) {
    $(jqId('modal_dialog_title')).text(' Export Ansible');
    $(jqId('modal_dialog_body')).empty();
    $(jqId('modal_dialog_footer')).empty();
    let table = d3.select(d3Id('modal_dialog_body')).append('div').append('div')
        .attr('id', 'load_to_git')
        .attr('class', 'table okit-table okit-modal-dialog-table');
    let tbody = table.append('div').attr('class', 'tbody');
    let tr = tbody.append('div').attr('class', 'tr');
    tr.append('div').attr('class', 'td').text('Destination:');

    div = tr.append('div')
        .attr('class', 'okit-horizontal-radio');
    div.append('input')
        .attr('type','radio')
        .attr('id', 'export_ansible_local')
        .attr('name', 'export_ansible_name')
        .attr('value', 'LOCAL')
        .attr('checked', 'checked')
        .on('change', () => {
            $(jqId('export_box_repo')).addClass('collapsed');
            $(jqId('export_box_filename')).addClass('collapsed');
            $(jqId('export_box_commitmsg')).addClass('collapsed');
        });
    div.append('label')
        .attr('for', 'export_ansible_local')
        .text('Local');
    // Apply
    div.append('input')
        .attr('type','radio')
        .attr('id', 'export_ansible_repo')
        .attr('name', 'export_ansible_name')
        .attr('value', 'GITREPO')
        .on('change', () => {
            $(jqId('export_box_repo')).removeClass('collapsed');
            $(jqId('export_box_filename')).removeClass('collapsed');
            $(jqId('export_box_commitmsg')).removeClass('collapsed');
        });
    div.append('label')
        .attr('for', 'export_ansible_repo')
        .text('Git');


    tr = tbody.append('div').attr('class', 'tr collapsed').attr('id', 'export_box_repo');
    tr.append('div').attr('class', 'td').text('Repository:');
    tr.append('div').attr('class', 'td').append('select')
        .attr('id', 'git_repository')
        .append('option')
        .attr('value', 'select')
        .text('Select');

    let git_repository_filename_select = d3.select(d3Id('git_repository'));

    for (let git_setting of okitOciConfig.settings) {
        git_repository_filename_select.append('option').attr('value', git_setting['url']+'*'+git_setting['branch']).text(git_setting['label']);
    }

    tr = tbody.append('div').attr('class', 'tr collapsed').attr('id', 'export_box_filename');
    tr.append('div').attr('class', 'td').text('Folder Name:');
    tr.append('div').attr('class', 'td').append('input')
        .attr('class', 'okit-input')
        .attr('id', 'git_repository_filename')
        .attr('type', 'text');

    tr = tbody.append('div').attr('class', 'tr collapsed').attr('id', 'export_box_commitmsg');
    tr.append('div').attr('class', 'td').text('Description:');
    tr.append('div').attr('class', 'td').append('input')
        .attr('class', 'okit-input')
        .attr('id', 'git_repository_commitmsg')
        .attr('type', 'text');

    // Submit
    let save_button = d3.select(d3Id('modal_dialog_footer')).append('div').append('button')
        .attr('id', 'export_ansible_option_id')
        .attr('type', 'button')
        .text('Submit');
    save_button.on("click", handleGenerateAnsibleOptionProceed);
    $(jqId('modal_dialog_wrapper')).removeClass('hidden');
}
function handleGenerateAnsibleOptionProceed(e) {
    okitJsonModel.export_ansible_name = $('input[name=export_ansible_name]:checked').val();
    if (okitJsonModel.export_ansible_name == 'LOCAL') {
        handleGenerateAnsible()
        $(jqId('modal_dialog_wrapper')).addClass('hidden');
    } else {
        okitJsonModel.git_repository = $(jqId('git_repository')).val();
        okitJsonModel.git_repository_filename = $(jqId('git_repository_filename')).val();
        okitJsonModel.git_repository_commitmsg = $(jqId('git_repository_commitmsg')).val();

        hideNavMenu();
        okitJsonModel.validate(generateAnsibleToRepo);
    }
}
function generateAnsibleToRepo(results) {
    if (results.valid) {
        let requestJson = JSON.parse(JSON.stringify(okitJsonModel));
        console.info(okitSettings);
        requestJson.use_variables = okitSettings.is_variables;
        $.ajax({
            type: 'post',
            url: 'generate/ansibletogit',
            dataType: 'text',
            contentType: 'application/json',
            data: JSON.stringify(requestJson),
            success: function(resp) {
                console.info('Response : ' + resp);
                $(jqId('modal_dialog_wrapper')).addClass('hidden');
                alert(resp);
            },
            error: function(xhr, status, error) {
                console.info('Status : '+ status)
                console.info('Error : '+ error)
            }
        });
    } else {
        validationFailedNotification();
    }
}
function handleGenerateAnsible(e) {
    hideNavMenu();
    okitJsonModel.validate(generateAnsible);
}
function generateAnsible(results) {
    if (results.valid) {
        let requestJson = JSON.parse(JSON.stringify(okitJsonModel));
        requestJson.use_variables = okitSettings.is_variables;
        $.ajax({
            type: 'post',
            url: 'generate/ansible',
            dataType: 'text',
            contentType: 'application/json',
            data: JSON.stringify(requestJson),
            success: function(resp) {
                console.info('REST Response : ' + resp);
                saveZip('generate/ansible');
            },
            error: function(xhr, status, error) {
                console.info('Status : '+ status)
                console.info('Error : '+ error)
            }
        });
    } else {
        validationFailedNotification();
    }
}

function handleGenerateTerraform11(e) {
    hideNavMenu();
    $.ajax({
        type: 'post',
        url: 'generate/terraform11',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(okitJson),
        success: function(resp) {
            console.info('Response : ' + resp);
            window.location = 'generate/terraform11';
        },
        error: function(xhr, status, error) {
            console.info('Status : '+ status)
            console.info('Error : '+ error)
        }
    });
}

function handleExportToResourceManager(e) {
    hideNavMenu();
    okitJsonModel.validate(generateResourceManager);
}
function generateResourceManager(results) {
    if (results.valid) {
        // Display Dialog
        displayResourceManagerDialog();
        // Set Config Profile
        console.info('Profile : ' + okitSettings.profile);
        if (!okitSettings.profile) {
            okitSettings.profile = 'DEFAULT';
        }
        console.info('Profile : ' + okitSettings.profile);
        okitSettings.home_region_key = '';
        okitSettings.home_region = '';
        ociRegions = [];
        $(jqId('config_profile')).val(okitSettings.profile);
        // Load Compartment Select
        loadCompartments();
        // Load Region Select
        loadRegions();
    } else {
        validationFailedNotification();
    }
}

function displayResourceManagerDialog() {
    $(jqId('modal_dialog_title')).text('Export To Resource Manager');
    $(jqId('modal_dialog_body')).empty();
    $(jqId('modal_dialog_footer')).empty();
    let query_form = d3.select(d3Id('modal_dialog_body')).append('div').append('form')
        .attr('id', 'query_oci_form')
        .attr('action', window.location.href)
        .attr('method', 'post');
    let table = query_form.append('div')
        .attr('class', 'table okit-table');
    let tbody = table.append('div')
        .attr('class', 'tbody');
    // Profile
    let tr = tbody.append('div')
        .attr('class', 'tr');
    tr.append('div')
        .attr('class', 'td')
        .text('Connection Profile');
    let profile_select = tr.append('div')
        .attr('class', 'td')
        .append('select')
        .attr('id', 'config_profile')
        .on('change', () => {
            console.info('Profile Select '+$(jqId('config_profile')).val());
            okitSettings.profile = $(jqId('config_profile')).val();
            okitSettings.save();
            // Clear Existing Compartments
            okitOciData.setCompartments([]);
            loadCompartments();
            loadRegions();
        });
    for (let section of okitOciConfig.sections) {
        profile_select.append('option')
            .attr('value', section)
            .text(section);
    }
    // Region Id
    tr = tbody.append('div')
        .attr('class', 'tr');
    tr.append('div')
        .attr('class', 'td')
        .text('Region');
    tr.append('div')
        .attr('class', 'td')
        .append('select')
            .attr('id', 'query_region_id')
            .on('change', () => {
                loadResourceManagerStacks();
                okitSettings.last_used_region = $(jqId('query_region_id')).val();
                okitSettings.save();
            })
            .append('option')
                .attr('value', 'Retrieving')
                .text('Retrieving..........');
    // Compartment Id
    tr = tbody.append('div')
        .attr('class', 'tr');
    tr.append('div')
        .attr('class', 'td')
        .text('Compartment');
    tr.append('div')
        .attr('class', 'td')
        .append('select')
            .attr('id', 'query_compartment_id')
            .on('change', () => {
                loadResourceManagerStacks();
                okitSettings.last_used_compartment = $(jqId('query_compartment_id')).val();
                okitSettings.save();
            })
            .append('option')
                .attr('value', 'Retrieving')
                .text('Retrieving..........');
    // Create / Update
    tr = tbody.append('div')
        .attr('class', 'tr');
    tr.append('div')
        .attr('class', 'td')
        .text('');
    let td = tr.append('div')
        .attr('class', 'td');
    // Create
    let div = td.append('div')
        .attr('class', 'okit-horizontal-radio');
    div.append('input')
        .attr('type','radio')
        .attr('id', 'rm_create')
        .attr('name', 'create_update_toggle')
        .attr('value', 'CREATE')
        .attr('checked', 'checked')
        .on('change', () => {
            $(jqId('stack_name_tr')).removeClass('collapsed');
            $(jqId('stack_id_tr')).addClass('collapsed');
            $(jqId('submit_query_btn')).text('Create Stack');
        });
    div.append('label')
        .attr('for', 'rm_create')
        .text('Create');
    // Update
    div.append('input')
        .attr('type','radio')
        .attr('id', 'rm_update')
        .attr('name', 'create_update_toggle')
        .attr('value', 'UPDATE')
        .on('change', () => {
            $(jqId('stack_name_tr')).addClass('collapsed');
            $(jqId('stack_id_tr')).removeClass('collapsed');
            $(jqId('submit_query_btn')).text('Update Stack');
            loadResourceManagerStacks();
        });
    div.append('label')
        .attr('for', 'rm_update')
        .text('Update');
    // Stack name
    tr = tbody.append('div')
        .attr('id', 'stack_name_tr')
        .attr('class', 'tr');
    tr.append('div')
        .attr('class', 'td')
        .text('Stack Name');
    tr.append('div')
        .attr('class', 'td')
        .append('input')
            .attr('type','text')
            .attr('id', 'stack_name')
            .attr('value', 'okit-stack-' + getTimestamp());
    // Stack Id
    tr = tbody.append('div')
        .attr('id', 'stack_id_tr')
        .attr('class', 'tr collapsed');
    tr.append('div')
        .attr('class', 'td')
        .text('Stacks');
    tr.append('div')
        .attr('class', 'td')
        .append('select')
        .attr('id', 'stack_id')
        .append('option')
        .attr('value', 'Retrieving')
        .text('Retrieving..........');
    // Plan / Apply
    tr = tbody.append('div')
        .attr('class', 'tr');
    tr.append('div')
        .attr('class', 'td')
        .text('');
    td = tr.append('div')
        .attr('class', 'td');
    // Plan
    div = td.append('div')
        .attr('class', 'okit-horizontal-radio');
    div.append('input')
        .attr('type','radio')
        .attr('id', 'rm_plan')
        .attr('name', 'plan_apply_toggle')
        .attr('value', 'PLAN')
        .attr('checked', 'checked');
    div.append('label')
        .attr('for', 'rm_plan')
        .text('Plan');
    // Apply
    div.append('input')
        .attr('type','radio')
        .attr('id', 'rm_apply')
        .attr('name', 'plan_apply_toggle')
        .attr('value', 'APPLY');
    div.append('label')
        .attr('for', 'rm_apply')
        .text('Apply');

    // Submit Button
    let submit = d3.select(d3Id('modal_dialog_footer')).append('div').append('button')
        .attr('id', 'submit_query_btn')
        .attr('type', 'button')
        .text('Create Stack')
        .on('click', function () {
            exportToResourceManager();
        });
    $(jqId('modal_dialog_wrapper')).removeClass('hidden');
}
function exportToResourceManager() {
    let request_json = JSON.clone(okitJsonModel);
    request_json.location = {
        config_profile: $(jqId('config_profile')).val(),
        compartment_id: $(jqId('query_compartment_id')).val(),
        region: $(jqId('query_region_id')).val(),
        stack_name: $('input[name=create_update_toggle]:checked').val() === 'CREATE' ? $(jqId('stack_name')).val().trim() : $('#stack_id  option:selected').text().trim(),
        stack_id: $(jqId('stack_id')).val() ? $(jqId('stack_id')).val().trim() : '',
        create_or_update: $('input[name=create_update_toggle]:checked').val(),
        plan_or_apply: $('input[name=plan_apply_toggle]:checked').val()
    };
    console.info('Resource Manager Options : ' + JSON.stringify(request_json));
    hideNavMenu();
    setBusyIcon();
    $(jqId('modal_dialog_progress')).removeClass('hidden');
    $(jqId('submit_query_btn')).text('.........Processing Stack');
    $(jqId('submit_query_btn')).attr('disabled', 'disabled');
    $.ajax({
        type: 'post',
        url: 'oci/resourcemanager',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(request_json),
        success: function(resp) {
            console.info('Response : ' + resp);
            unsetBusyIcon();
            $(jqId('modal_dialog_wrapper')).addClass('hidden');
            $(jqId('modal_dialog_progress')).addClass('hidden');
        },
        error: function(xhr, status, error) {
            console.info('Status : '+ status)
            console.info('Error : '+ error)
            unsetBusyIcon();
            $(jqId('modal_dialog_wrapper')).addClass('hidden');
            $(jqId('modal_dialog_progress')).addClass('hidden');
            alert(`Export to Resource Manager Failed (${error})`);
        }
    });
}
function loadResourceManagerStacks() {
    // Clear Select
    let select = $(jqId('stack_id'));
    $(select).empty();
    select.append($('<option>').attr('value', 'Retrieving').text('Retrieving..........'));
    let request_json = {};
    request_json.location = {
        config_profile: $(jqId('config_profile')).val(),
        compartment_id: $(jqId('query_compartment_id')).val(),
        region: $(jqId('query_region_id')).val()
    };
    $.ajax({
        type: 'get',
        url: 'oci/resourcemanager',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(request_json),
        success: function(resp) {
            let jsonBody = JSON.parse(resp)
            $(jqId('stack_id')).empty();
            let stack_select = d3.select(d3Id('stack_id'));
            for(let stack of jsonBody ){
                stack_select.append('option')
                    .attr('value', stack['id'])
                    .text(stack['display_name']);
            }
            $(jqId('stack_id')).val($("#stack_id option:first").val());
        },
        error: function(xhr, status, error) {
            console.info('Status : '+ status)
            console.info('Error : '+ error)
        }
    });
}

function handleExportToResourceManagerGitLab(e) {
    hideNavMenu();
    okitJsonModel.validate(generateResourceManagerGitLab);
}
function generateResourceManagerGitLab(results) {
    if (results.valid) {
        let requestJson = JSON.parse(JSON.stringify(okitJsonModel));
        console.info(okitSettings);
        requestJson.use_variables = okitSettings.is_variables;
        $.ajax({
            type: 'post',
            url: 'generate/resource-manager',
            dataType: 'text',
            contentType: 'application/json',
            data: JSON.stringify(requestJson),
            success: function(resp) {
                console.info('Response : ' + resp);
                saveZip('generate/resource-manager');
            },
            error: function(xhr, status, error) {
                console.info('Status : '+ status)
                console.info('Error : '+ error)
            }
        });
    } else {
        validationFailedNotification();
    }
}

