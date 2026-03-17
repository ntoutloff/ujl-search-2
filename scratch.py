from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json


load_dotenv()

URI = os.getenv('MONGO_URI')

with MongoClient(URI) as client:
    or_collection = client['UJL']['overrides']
    ujl_collection = client['UJL']['universalJournalList']
    override_doc = or_collection.find_one({'value': 'Fish Pathol'})

    
    ujl_docs = ujl_collection.find(
        {
            '$and': [
                {'journal_names': override_doc['value']},
                {'journal_names': {'$in': override_doc['overrides']}}
            ]
        }
    ).to_list(10)
    
    if len(ujl_docs) == 1:
        doc_id = ujl_docs[0]['_id']
        print(doc_id)
        res = ujl_collection.update_one(
            {"_id": doc_id},
            [
                {
                    "$set": {
                        "journal_names": {
                            "$concatArrays": [
                                [override_doc['value']],
                                {
                                    "$filter": {
                                        "input": "$journal_names",
                                        "cond": {"$ne": ["$$this", override_doc['value']]}
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        )
        print(res)



    elif len(ujl_docs) < 1:
        print('no results')

    else:
        print(f'multiple ({len(ujl_docs)}) results were found')
    

