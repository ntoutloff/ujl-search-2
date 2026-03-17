const journalNamesRadioList = document.getElementById('journal-names-list');
const publisherNamesRadioList = document.getElementById('publisher-names-list');

// Hidden data
const hiddenInput = document.getElementById('hidden-data');
hiddenInput.value = JSON.stringify(journalData);


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

document.querySelector('input[name="journal_name_override"').checked = true;


// Publisher name
if (journalData.publisher_names.length >= 1) {

    document.getElementById('publisher-div').style = 'display: block;';

    console.log(journalData.publisher_names);
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
}

document.querySelector('input[name="publisher_name_override"').checked = true;
