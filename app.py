from flask import Flask, redirect, render_template, url_for, request, jsonify
from flask_wtf import FlaskForm
from wtforms import SubmitField, SelectMultipleField
from wtforms.widgets import ListWidget, CheckboxInput
from flask_pymongo import PyMongo
from pymongo.synchronous.collection import Collection
from dotenv import load_dotenv
import os
from pymongo.synchronous.collection import Collection
import pandas as pd
from typing import Literal
import json
from datetime import date

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = 'UJL'

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MONGO_URI'] = MONGO_URI + MONGO_DB
mongo = PyMongo(app)

def set_overrides(data: dict):
    journal_data = json.loads(data['journal_data'])
    
    journal_override: str = data.get('journal_name_override')
    publisher_override: str = data.get('publisher_name_override')
    all_journals: list[str] = journal_data['journal_names']
    all_publishers: list[str] = journal_data['publisher_names']
    
    ujl_coll: Collection = mongo.db.universalJournalList
    overrides_coll: Collection = mongo.db.overrides

    # Journal Name
    if journal_override and journal_override != all_journals[0]:
        
        ## Modify UJL
        docs = ujl_coll.find(
                {
                    '$and': [
                        {'journal_names': journal_override},
                        {'journal_names': {'$in': [name for name in all_journals if name != journal_override]}}
                    ]
                }
        ).to_list(10)

        if len(docs) == 1:
            doc = docs[0]
            ujl_coll.update_one(
                {"_id": doc['_id']},
                [
                    {
                        "$set": {
                            "journal_names": {
                                "$concatArrays": [
                                    [journal_override],
                                    {
                                        "$filter": {
                                            "input": "$journal_names",
                                            "cond": {"$ne": ["$$this", journal_override]}
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            )
        else:
            print(f'For journal, no updates to UJL as there were {len(docs)} matches.')

        # Update overrides collection
        res = overrides_coll.delete_many({'type': 'journal_name', 'value': {'$in': all_journals}})
        print(f'{res.deleted_count} journal_name documents deleted from overrides collection.')
        res = overrides_coll.insert_one(
            {
                'type': 'journal_name',
                'value': journal_override,
                'overrides': [name for name in all_journals if name != journal_override],
                'date_added': str(date.today())
            }
        )
        print('1 journal_name document add to overrides collection.')

    # Publisher Names
    if publisher_override and publisher_override != all_publishers[0]:

        # Modify UJL
        docs = ujl_coll.find(
            {
                '$and': [
                    {'publisher_names': publisher_override},
                    {'publisher_names': {'$in': [name for name in all_publishers if name != publisher_override]}},
                    {'journal_names': {'$in': all_journals}}
                ]
            }
        ).to_list(10)

        if len(docs) == 1:
            doc = docs[0]
            ujl_coll.update_one(
                {"_id": doc['_id']},
                [
                    {
                        "$set": {
                            "publisher_names": {
                                "$concatArrays": [
                                    [publisher_override],
                                    {
                                        "$filter": {
                                            "input": "$publisher_names",
                                            "cond": {"$ne": ["$$this", publisher_override]}
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            )
        else:
            print(f'For publisher, no updates to UJL as there were {len(docs)} matches.')


        res = overrides_coll.delete_many({'type': 'publisher_name', 'value': {'$in': all_publishers}})
        print(f'{res.deleted_count} publisher_name documents deleted from overrides collection.')
        overrides_coll.insert_one(
            {
                'type': 'publisher_name',
                'value': publisher_override,
                'overrides': [name for name in all_publishers if name != publisher_override],
                'for': all_journals,
                'date_added': str(date.today())
            }
        )
        print('1 publisher_name document added to overrides collection.')


def mongo_search(
        query: str,
        search_type: Literal['journal_name', 'issn'],
        domain: Literal['all', 'ja_only', 'pr_only'] = 'all',
        limit: int = 20
):

    col: Collection = mongo.db.universalJournalList
    pipeline = []

    if search_type == 'journal_name':
        pipeline.append(
            {
                '$search': {
                    'index': 'default',
                    'text': {
                        'query': query,
                        'path': 'journal_names'
                    }
                }
            }
        )
    if search_type == 'issn':
        issns = [i.strip(' \n\t') for i in query.split(',')]
        pipeline.append(
            {
                '$search': {
                    'index': 'default',
                    'compound': {
                        'should': []
                    }
                }
            }
        )
        for issn in issns:
            pipeline[0]['$search']['compound']['should'].append(
                {
                    'equals': {
                        'path': 'issns',
                        'value': issn,
                    }
                }
            )
                
    if domain == 'ja_only':
        pipeline.append({'$match': {'locations.zoho.Journalytics Status': 'Approved'}})

    if domain == 'pr_only':
        pipeline.append({'$match': {'locations.predatoryReports.status': 'published'}})

    pipeline.extend(
        [{ '$project': { '_id': 0 } },
        { '$limit': limit }]
    )
    return list(col.aggregate(pipeline))


@app.get('/')
def index():
    return render_template('index.html')


@app.post('/search')
def search():
    data: dict = request.get_json()
    search_results = mongo_search(
        query=data.get('query'),
        search_type=data.get('search_type', 'journal_name'),
        domain=data.get('search_domain', 'all'),
        limit=int(data.get('limit', 10))
    )
    return search_results if search_results else []

@app.post('/override')
def override():
    journal_data = request.form.get('journal_data')
    print(type(journal_data))
    print(journal_data)

    return render_template('override.html', journal_data=json.loads(journal_data))

@app.post('/submit_override')
def submit_override():
    form_data = request.form.to_dict()
    set_overrides(form_data)
    return redirect(url_for('index'))
    


if __name__ == '__main__':
    app.run(debug=True)


