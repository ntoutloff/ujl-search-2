from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json
from typing import Any


load_dotenv()

URI = os.getenv('MONGO_URI')
issn_chain = ['0360-1315', '1873-782X']

with MongoClient(URI) as client:
    issns_collection = client['UJL']['issns']

    issn_docs: list[dict[str, list[str] | dict[str, Any]]] = issns_collection.find({'issn': {'$in': issn_chain}}).to_list(100)

    upload_doc: dict[str, list[str] | dict[str, Any]] = {
        "issns": issn_chain,
        "journal_names": list({name for doc in issn_docs for name in doc.get("journal_names", [])}),
        "publisher_names": list({name for doc in issn_docs for name in doc.get("publisher_names", [])}),
        "locations": {},
    }
    for doc in issn_docs:
        for location, records in doc.get("locations", {}).items():
            upload_doc["locations"].setdefault(location, [])
            upload_doc["locations"][location].extend(r["data"] for r in records if r["data"] not in upload_doc["locations"][location])

    # generate a dict of name and locations
    sort_dict = {}
   
    
    for doc in issn_docs:
        for location_name in doc['locations']:
            for record in doc['locations'][location_name]:
                for name in record['journal_names']:
                    my_name = ''
                    if location_name == 'pubmed' and name != record['data']['JournalTitle']:
                        my_name = 'alts'

                    elif location_name == 'openAlex' and name != record['data']['display_name']:
                        my_name = 'alts'
                    
                    else:
                        my_name = location_name

                    if name not in sort_dict:
                        
                        sort_dict[name] = {my_name}
                    else:
                        sort_dict[name].add(my_name)

    sort_dict = {k: list(v) for k, v in sort_dict.items()} 
    print(json.dumps(sort_dict, indent=4))

    source_list = [
        'zoho',
        'predatoryReports',
        'ebsco',
        'abdc',
        'jufo',
        'pubmed',
        'doaj',
        'scopus',
        'scite',
        'scimago',
        'openAlex',
        'crossref',
        'alts'
    ]

    my_list = []

    print(upload_doc['journal_names'])
    for source in source_list:
        for journal_name, locations in sort_dict.items():
            if source in locations:
                if journal_name not in my_list:
                    my_list.append(journal_name)
                
    print(my_list)

    

