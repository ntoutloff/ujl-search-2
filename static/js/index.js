const searchBtn = document.getElementById('searchBtn');

const displayNameLookup = {
    abdc: 'ABDC',
    crossref: 'Crossref',
    doaj: 'DOAJ',
    ebsco: 'EBSCO',
    jufo: 'JUFO',
    openAlex: 'OpenAlex',
    predatoryReports: 'Predatory Reports',
    pubmed: 'PubMed',
    scimago: 'Scimago',
    scite: 'Scite',
    scopus: 'Scopus',
    zoho: 'Journalytics'
};

function renderResults(searchResults) {
    const results = document.getElementById('results')
    results.innerHTML = ''

    for (const journalData of searchResults) {

        // Journal Card
        const journalCard = document.createElement('div');
        journalCard.className = 'card my-3 px-3';
        results.appendChild(journalCard);

        // Journal Card Body
        const journalCardBody = document.createElement('div');
        journalCardBody.className = 'card-body';
        journalCard.appendChild(journalCardBody)

        // Create badges
        const badges = document.createElement('div');
        badges.className = 'badges-div';
        journalCardBody.appendChild(badges);

        let status = {
            in_ja: false,
            ja_approved: false,
            ja_denied: false,
            in_pr: false,
            pr_published: false
        };

        if (journalData.locations.zoho) {
            status.in_ja = true;
            journalData.locations.zoho.forEach(record => {
                if (record["Journalytics Status"] == "Approved") {
                    status.ja_approved = true;
                }
                if (record["Journalytics Status"] == "Denied") {
                    status.ja_denied = true;
                }
            });
        }

        if (journalData.locations.predatoryReports) {
            status.in_pr = true;
            journalData.locations.predatoryReports.forEach(record => {
                if (record["status"] == "published") {
                    status.pr_published = true;
                }
            });
        }

        if (status.ja_approved) {
            const badgeElement = document.createElement("span");
            badgeElement.className = "badge text-bg-success me-1";
            badgeElement.textContent = "Journalytics Approved";
            badges.append(badgeElement);
        }

        if (status.ja_denied) {
            const badgeElement = document.createElement("span");
            badgeElement.className = "badge text-bg-warning me-1";
            badgeElement.textContent = "Journalytics Denied";
            badges.append(badgeElement);
        }

        if (status.pr_published) {
            const badgeElement = document.createElement("span");
            badgeElement.className = "badge text-bg-danger me-1";
            badgeElement.textContent = "Predatory Journal";
            badges.append(badgeElement);
        }

        // Card title and subtitle
        const journalName = document.createElement('h2');
        journalName.className = 'card-title';
        journalName.textContent = journalData.journal_names[0];
        journalCardBody.appendChild(journalName)

        if (journalData.publisher_names) {
            const publisherName = document.createElement('h5');
            publisherName.className = 'card-subtitle';
            publisherName.textContent = journalData.publisher_names[0];
            journalCardBody.appendChild(publisherName)
        }

        // Setup tabs
        const localTabs = [];
        const localContents = [];

        const journalContent = document.createElement('div');
        journalCardBody.appendChild(journalContent);

        const tabsBlock = document.createElement('div');
        tabsBlock.className = 'tabs';
        journalContent.appendChild(tabsBlock);

        // Overview tab
        const tabBtn = document.createElement('div');
        tabBtn.className = 'tab active';
        tabBtn.dataset.tab = 'overview';
        tabBtn.textContent = 'Overview';
        tabsBlock.appendChild(tabBtn);
        localTabs.push(tabBtn);

        // Overview content
        const content = document.createElement('div');
        content.id = 'overview';
        content.className = 'tab-content active';
        journalContent.appendChild(content);

        const overview = createOverview(journalData);
        content.appendChild(overview);

        localContents.push(content);

        // Add tabs and content for each location.
        for (const locationName in journalData.locations) {
            const locationDisplayName = displayNameLookup[locationName];

            // Tab
            const tabBtn = document.createElement('div');
            tabBtn.className = 'tab';
            tabBtn.dataset.tab = locationName;
            tabBtn.textContent = locationDisplayName;
            if (journalData.locations[locationName].length > 1) {
                tabBtn.textContent += ` (x${journalData.locations[locationName].length})`
            }
            tabsBlock.appendChild(tabBtn);
            localTabs.push(tabBtn);

            // Content
            const content = document.createElement('div');
            content.id = locationName;
            content.className = 'tab-content';
            journalContent.appendChild(content);

            for (let i = 0; i < journalData.locations[locationName].length; i++) {
                if (journalData.locations[locationName].length > 1) {

                    // Display the Record number above the record
                    const recordLabel = document.createElement('h5');
                    recordLabel.className = 'text-success';
                    recordLabel.textContent = `Record ${i + 1}:`
                    content.appendChild(document.createElement('br'));
                    content.appendChild(recordLabel);
                }

                // Table
                const table = buildTable(journalData.locations[locationName][i]);
                content.appendChild(table);
            }

            localContents.push(content);
        }

        // Tab event listners
        localTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                localTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                localContents.forEach(c => {
                    if (c.id === target) {
                        c.classList.add('active');
                    } else {
                        c.classList.remove('active');
                    }
                });
            });
        });
    }
}

function createOverview(journalData) {
    const overviewContent = document.createElement('div');
    const overviewCols = document.createElement('div');
    // overviewCols.style = 'display: flex;';
    overviewContent.appendChild(overviewCols);

    // Journal Names
    const journalNamesCol = document.createElement('div');
    journalNamesCol.className = 'overview-col';
    overviewCols.appendChild(journalNamesCol);

    const journalNamesHeader = document.createElement('h4');
    journalNamesHeader.style = 'border-bottom: 2px solid black;';
    journalNamesHeader.textContent = 'Journal Names';
    journalNamesCol.appendChild(journalNamesHeader);

    const journalNamesList = document.createElement('ul');
    journalNamesList.className = 'list-group list-group-flush';
    journalNamesList.style = 'text-align: left;';
    journalNamesCol.appendChild(journalNamesList);

    for (const journalName of journalData.journal_names) {
        const journalNamesListItem = document.createElement('li');
        journalNamesListItem.className = 'list-group-item';
        journalNamesListItem.textContent = journalName;
        journalNamesList.appendChild(journalNamesListItem);
    }

    // Publisher Names

    if (journalData.publisher_names.length >= 1) {
        const publisherNamesCol = document.createElement('div');
        publisherNamesCol.className = 'overview-col';
        overviewCols.appendChild(publisherNamesCol);

        const publisherNamesHeader = document.createElement('h4');
        publisherNamesHeader.style = 'border-bottom: 2px solid black;';
        publisherNamesHeader.textContent = 'Publisher Names';
        publisherNamesCol.appendChild(publisherNamesHeader);

        const publisherNamesList = document.createElement('ul');
        publisherNamesList.className = 'list-group list-group-flush';
        publisherNamesList.style = 'text-align: left;';
        publisherNamesCol.appendChild(publisherNamesList);

        for (const publisherName of journalData.publisher_names) {
            const publisherNamesListItem = document.createElement('li');
            publisherNamesListItem.className = 'list-group-item';
            publisherNamesListItem.textContent = publisherName;
            publisherNamesList.appendChild(publisherNamesListItem);
        }
    }

    // ISSNs
    const issnsCol = document.createElement('div');
    issnsCol.className = 'overview-col';
    overviewCols.appendChild(issnsCol);

    const issnsHeader = document.createElement('h4');
    issnsHeader.style = 'border-bottom: 2px solid black;';
    issnsHeader.textContent = 'ISSNs';
    issnsCol.appendChild(issnsHeader);

    const issnsList = document.createElement('ul');
    issnsList.className = 'list-group list-group-flush';
    issnsList.style = 'text-align: left;';
    issnsCol.appendChild(issnsList);

    for (const issn of journalData.issns) {
        const issnsListItem = document.createElement('li');
        issnsListItem.className = 'list-group-item';
        issnsListItem.textContent = issn;
        issnsList.appendChild(issnsListItem);
    }

    // Override form
    const overrideForm = document.createElement('form');
    overrideForm.setAttribute('action', '/override');
    overrideForm.setAttribute('method', 'POST');
    overviewContent.appendChild(overrideForm);

    const dataToSend = {
        journal_names: journalData.journal_names,
        publisher_names: journalData.publisher_names,
        issns: journalData.issns
    };

    const overrideInput = document.createElement('input');
    Object.assign(overrideInput, {
        type: 'hidden',
        name: 'journal_data',
        value: JSON.stringify(dataToSend)
    });
    overrideForm.append(overrideInput);

    const overrideBtn = document.createElement('button');
    overrideBtn.type = 'submit';
    overrideBtn.className = 'btn btn-outline-primary';
    overrideBtn.textContent = 'Set Overrides';
    overrideForm.appendChild(overrideBtn);

    return overviewContent;
}


function buildTable(locationData, isNested = false) {
    const table = document.createElement("table");

    // We need CSS to handle the outer `nester` table differently from
    // `nested` tables, so give it a `nested` class name if needed.
    if (isNested) {
        table.classList.add("nested");
    }

    for (const key in locationData) {
        const row = table.insertRow();

        const keyCell = row.insertCell();
        keyCell.classList.add("key");
        keyCell.textContent = key;

        const valueCell = row.insertCell();

        const value = locationData[key];
        if (typeof value === "object" && value !== null) {
            if (Array.isArray(value)) {
                // An array becomes a list in a cell.
                const ul = document.createElement("ul");

                value.forEach(item => {
                    const li = document.createElement("li");

                    // If this item in the array is an object itself,
                    // recursively call this function to build a nested table.
                    if (typeof item === "object" && item !== null) {
                        const nestedTable = buildTable(item, true);
                        li.appendChild(nestedTable);
                    } else {
                        li.textContent = item;
                    }
                    ul.appendChild(li);
                });

                valueCell.appendChild(ul);
            } else {
                // It's whatever javascript calls a dictionary, so nested table.
                valueCell.classList.add("nester");
                const nestedObject = buildTable(value, true);
                valueCell.appendChild(nestedObject);
            }
        } else if (typeof value === "string" && value.startsWith("http")) {
            // I'm sure there is a better way of telling if a string is a URL or not.
            const a = document.createElement("a");
            a.href = value;
            a.target = "_blank";
            a.textContent = value;
            valueCell.appendChild(a);
        } else {
            // Finally, must be a plain old string or number.
            valueCell.textContent = value;
        }
    }
    return table;
}

// Fetch search results from /search
document.getElementById('searchForm').addEventListener('submit', function (event) {
    event.preventDefault();
    searchBtn.disabled = true;

    const formData = new FormData(this);
    const dataObject = Object.fromEntries(formData.entries());

    fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataObject)
    })
        .then(response => response.json())
        .then(data => {
            renderResults(data);
            searchBtn.disabled = false;
        });
});