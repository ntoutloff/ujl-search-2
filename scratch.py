from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json


load_dotenv()

URI = os.getenv('MONGO_URI')

with MongoClient(URI) as client:
    overrides_col = client['UJL']['overrides']
    ujl_col = client['UJL']['universalJournalList']
    override_doc = overrides_col.find_one({'type': 'publisher_name'}, {'_id': 0})

    print(json.dumps(override_doc, indent=4))

    ujl_docs = ujl_col.find(
        {
            '$and': [
                {'publisher_names': {'$in': override_doc['overrides']}},
                {'journal_names': {'$in': override_doc['for']}}
            ]
        },
        {
            '_id': 0,
            'journal_names': 1,
            'publisher_names': 1,
            'issns': 1
        }
    )
    for doc in ujl_docs:
        print(json.dumps(doc, indent=4))

