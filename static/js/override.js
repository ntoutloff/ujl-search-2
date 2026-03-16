const journalNamesRadioList = document.getElementById('journal-names-list');
const publisherNamesRadioList = document.getElementById('publisher-names-list');

// Hidden data
const hiddenData = document.getElementById('hidden-data');
hiddenData.value = JSON.stringify(journalData);


// Journal name
for (const value of journalData.journal_names) {
    const formCheck = document.createElement('div');
    formCheck.className = 'form-check';
    journalNamesRadioList.appendChild(formCheck);

    const formInput = document.createElement('input');
    Object.assign(formInput, {
        className: 'form-check-input',
        type: 'radio',
        name: 'journal_name_override',
        id: value,
        value: value
    })
    formCheck.appendChild(formInput);

    const formLabel = document.createElement('label');
    Object.assign(formLabel, {
        className: 'form-check-label',
        htmlFor: value,
        textContent: value
    })
    formCheck.appendChild(formLabel);
}

// Journal names clear button
const clearJournalNamesBtn = document.getElementById('uncheck-journal-names');
clearJournalNamesBtn.addEventListener('click', function() {
    const radioBtns = document.querySelectorAll('input[type="radio"][name="journal_name_override"]');
    radioBtns.forEach(function(radioBtn) {
        radioBtn.checked = false;
    })
})


// Publisher name
for (const value of journalData.publisher_names) {
    const formCheck = document.createElement('div');
    formCheck.className = 'form-check';
    publisherNamesRadioList.appendChild(formCheck);

    const formInput = document.createElement('input');
    Object.assign(formInput, {
        className: 'form-check-input',
        type: 'radio',
        name: 'publisher_name_override',
        id: value,
        value: value
    })
    formCheck.appendChild(formInput);

    const formLabel = document.createElement('label');
    Object.assign(formLabel, {
        className: 'form-check-label',
        htmlFor: value,
        textContent: value
    })
    formCheck.appendChild(formLabel);
}

// Journal names clear button
const clearPublisherNamesBtn = document.getElementById('uncheck-publisher-names');
clearPublisherNamesBtn.addEventListener('click', function() {
    const radioBtns = document.querySelectorAll('input[type="radio"][name="publisher_name_override"]');
    radioBtns.forEach(function(radioBtn) {
        radioBtn.checked = false;
    })
})



