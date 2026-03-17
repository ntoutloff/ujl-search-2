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
    col: Collection = mongo.db.overrides

    journal_data = json.loads(data['journal_data'])

    journal_override: str = data.get('journal_name_override')
    publisher_override: str = data.get('publisher_name_override')
    all_journals: list[str] = journal_data['journal_names']
    all_publishers: list[str] = journal_data['publisher_names']

    if journal_override and journal_override != all_journals[0]:
        for name in [name for name in all_journals if name != journal_override]:
            col.find_one_and_delete({'value': name})
            
        col.insert_one(
            {
                'type': 'journal_name',
                'value': journal_override,
                'overrides': [name for name in all_journals if name != journal_override],
                'date_added': str(date.today())
            }
        )

    if publisher_override and publisher_override != all_publishers[0]:
        for name in [name for name in all_publishers if name != publisher_override]:
            col.find_one_and_delete({'value': name})

        col.insert_one(
            {
                'type': 'publisher_name',
                'value': publisher_override,
                'overrides': [name for name in all_publishers if name != publisher_override],
                'for': all_journals,
                'date_added': str(date.today())
            }
        )

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


