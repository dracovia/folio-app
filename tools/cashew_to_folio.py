#!/usr/bin/env python3
"""Offline Cashew CSV + SQLite export -> Folio JSON (stdlib only; no network).

Usage: python tools/cashew_to_folio.py cashew.csv cashew.sql folio-import.json

The .sql file exported by Cashew is actually a SQLite database. This script does
not execute SQL from the file. All reads are read-only, parameter-free SELECTs.
"""
from __future__ import annotations
import argparse
import csv
import datetime as dt
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

EMOJI = {'dining':'🍽️','groceries':'🛒','shopping':'🛍️','entertainment':'🎬',
 'bills & fees':'🧾','gifts':'🎁','work':'💼','travel':'✈️','income':'💰',
 'beauty':'💄','skincare':'🧴','haircare':'💇','body care':'🧴','laser treatments':'✨',
 'healthcare':'🏥','doctor visits':'🩺','medication & supplements':'💊',
 'transit':'🚕','pets':'🐈','cat food':'🥫','cat litter':'🐾',
 'veterinary care':'🐈','accessories':'🧸'}


def color(s, fallback='#8577db'):
    """Cashew stores Flutter ARGB 0xffRRGGBB; Folio accepts #RRGGBB."""
    if s:
        match = re.fullmatch(r'0[xX][0-9a-fA-F]{2}([0-9a-fA-F]{6})',str(s))
        if match:
            return '#' + match.group(1).lower()
    return fallback


def get_data(conn, name):
    return [dict(row) for row in conn.execute(f'SELECT * FROM "{name}"')]


def nkey(t):
    return (t.get('name','').strip().casefold(), round(float(t['amount']),2))


def main(csv_path: Path, sqlite_path: Path, out_path: Path):
    if sqlite_path.open('rb').read(16) != b'SQLite format 3\0':
        raise ValueError('Expected a Cashew SQLite backup (.sql), not a text SQL dump.')
    with csv_path.open(encoding='utf-8-sig',newline='') as fh:
        dr=csv.DictReader(fh)
        if not {'amount','amount unpaid','date','title','type','category name','subcategory name'}.issubset(dr.fieldnames or []):
            raise ValueError('Unrecognized Cashew CSV headers.')
        csv_rows=list(dr)
    conn=sqlite3.connect(sqlite_path.resolve().as_uri()+'?mode=ro',uri=True)
    conn.row_factory=sqlite3.Row
    required={'wallets','categories','transactions','budgets','category_budget_limits'}
    existing={r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if not required.issubset(existing):
        raise ValueError('The SQLite file does not contain the required Cashew tables.')
    raw_cats=get_data(conn,'categories')
    raw_wallets=get_data(conn,'wallets')
    raw_txs=get_data(conn,'transactions')
    raw_budgets=get_data(conn,'budgets')
    raw_limits=get_data(conn,'category_budget_limits')
    if not raw_wallets:
        raise ValueError('Cashew backup contains no wallets.')
    cat_by_pk={c['category_pk']:c for c in raw_cats}
    categories=[]
    for c in raw_cats:
        parent=cat_by_pk.get(c['main_category_pk'])
        categories.append({
            'id':'cashew-cat-'+c['category_pk'],
            'name':c['name'],
            'parentId':'cashew-cat-'+c['main_category_pk'] if parent else '',
            'kind':'income' if c['income'] else 'expense',
            'emoji':(c['emoji_icon_name'] or '').strip() or EMOJI.get(c['name'].lower(), EMOJI.get(parent['name'].lower(),'📦') if parent else '📦'),
            'color':color(c['colour'] or (parent or {}).get('colour')),
            'archived':bool(c['archived'])
        })
    wallets=[{'id':'cashew-wallet-'+w['wallet_pk'],'name':w['name'],
              'openingBalance':0,'color':color(w['colour'], '#6658de')} for w in raw_wallets]
    # Cashew wallet table has no opening balance. A zero placeholder is explicit,
    # not an assertion about the real bank balance.
    csv_count_paid=0
    tx_pool=defaultdict(list)
    for raw in raw_txs:
        tx_pool[nkey(raw)].append(raw)
    transactions=[]
    schedules=[]
    warnings=[]
    consumed=set()
    for index,row in enumerate(csv_rows):
        raw_amount=row['amount'] or row['amount unpaid']
        if not raw_amount:
            warnings.append(f'CSV row {index+2}: missing amount; skipped.')
            continue
        signed=round(float(raw_amount),2)
        if signed==0:
            warnings.append(f'CSV row {index+2}: zero-amount entry skipped.')
            continue
        category_name=row.get('category name','').strip()
        subcategory_name=row.get('subcategory name','').strip()
        raw_candidates=tx_pool[(row.get('title','').strip().casefold(),signed)]
        candidates=[r for r in raw_candidates if r['transaction_pk'] not in consumed]
        if len(candidates)>1:
            candidates.sort(key=lambda r:(cat_by_pk.get(r['category_fk'],{}).get('name','')!=category_name,
                                          cat_by_pk.get(r['sub_category_fk'],{}).get('name','')!=subcategory_name,
                                          r['note']!=row.get('note','')))
        record=candidates[0] if candidates else None
        if record:
            consumed.add(record['transaction_pk'])
            catpk=record['sub_category_fk'] or record['category_fk']
            walletpk=record['wallet_fk']
            itemid=record['transaction_pk']
        else:
            # Fallback when a CSV has transactions newer than its SQLite backup.
            matched=[c for c in raw_cats if c['name']==(subcategory_name or category_name)]
            catpk=matched[0]['category_pk'] if matched else ''
            wallet=[w for w in raw_wallets if w['name']==row.get('account')]
            walletpk=wallet[0]['wallet_pk'] if wallet else raw_wallets[0]['wallet_pk']
            itemid=f'csv-row-{index}'
            warnings.append(f'CSV row {index+2}: not found in backup, imported from CSV fields.')
        date=row['date'][:10]
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',date):
            warnings.append(f'CSV row {index+2}: invalid date, skipped.')
            continue
        ttype='income' if signed>0 else 'expense'
        base={'type':ttype,'amount':abs(signed),'categoryId':'cashew-cat-'+catpk,
              'walletId':'cashew-wallet-'+walletpk,'toWalletId':'',
              'payee':row['title'].strip(),'note':row.get('note','').strip()}
        # Only unpaid Cashew entries are schedules. The CSV 'extra' column says
        # 'repeat every 1 month' for *every* entry, including ordinary one-offs,
        # so we cannot rely on it to identify recurrent payments.
        is_unpaid=bool(row['amount unpaid'])
        if is_unpaid:
            # Explicit type=repetitive is recurring. Type=upcoming is merely
            # a pending single payment, not evidence of recurrence.
            repeat=row.get('type','').lower()=='repetitive'
            schedules.append({'id':'cashew-schedule-'+itemid, **base, 'frequency':'monthly',
                   'startDate':date,'endDate':'','active':True,'autoPost':False,
                   'skipDates':[],'oneTime':not repeat,'importedFromCashew':True})
        else:
            csv_count_paid+=1
            transactions.append({'id':'cashew-tx-'+itemid, **base,'date':date,'tags':[],
                       'excluded':False,'scheduleId':None,'occurrenceDate':None,
                       'createdAt':row['date'].replace(' ','T').replace('.000','')})
    # If the two exports were taken at different moments, refuse silent loss.
    missing=[r for r in raw_txs if r['transaction_pk'] not in consumed]
    if missing:
        warnings.append(f'{len(missing)} SQLite transactions unmatched by the CSV (not auto-imported: dates may be unreliable).')
    budget_map={}
    budgets=[]
    for b in raw_budgets:
        bid='cashew-budget-'+b['budget_pk']
        budget_map[b['budget_pk']]=bid
        try:
            raw_ids=json.loads(b['category_fks'] or '[]')
        except (ValueError,TypeError):
            raw_ids=[]
            warnings.append('One budget had unreadable category filters; all expenses included.')
        period_map={0:'custom',1:'daily',2:'weekly',3:'monthly',4:'yearly'}
        period=period_map.get(b['reoccurrence'],'monthly')
        start_date=dt.datetime.fromtimestamp(b['start_date'],dt.timezone.utc).date().isoformat()
        end_date=dt.datetime.fromtimestamp(b['end_date'],dt.timezone.utc).date().isoformat()
        budgets.append({'id':bid,'name':b['name'],'amount':abs(float(b['amount'])),
           'period':period,'categoryIds':['cashew-cat-'+str(x) for x in raw_ids if str(x) in cat_by_pk],
           'active':not bool(b['archived']),'importedFromCashew':True,'capUnit':'amount' if b['is_absolute_spending_limit'] else 'percent',
           'startDate':start_date if period=='custom' else '', 'endDate':end_date if period=='custom' else '',
           'sourceStartDate':start_date})
    for cap in raw_limits:
        c=cat_by_pk.get(cap['category_fk'])
        if not c:
            warnings.append('A category budget cap references a missing category and was skipped.')
            continue
        budgets.append({'id':'cashew-cap-'+cap['category_limit_pk'],
           'name':c['name']+' limit','amount':abs(float(cap['amount'])),
           'period':next((b['period'] for b in budgets if b['id']==budget_map.get(cap['budget_fk'])), 'monthly'),'limitMode':next((b['capUnit'] for b in budgets if b['id']==budget_map.get(cap['budget_fk'])),'amount'),'categoryIds':['cashew-cat-'+cap['category_fk']],
           'active':True,'parentBudgetId':budget_map.get(cap['budget_fk'],''),
           'importedFromCashew':True})
    result={'version':1,'settings':{'currency':'USD','autoPost':False},
      'wallets':wallets,'categories':categories,'transactions':transactions,
      'budgets':budgets,'schedules':schedules,
      'migration':{'source':'Cashew CSV + SQLite','exportDate':csv_path.name,
                   'walletOpeningBalancesKnown':False,'warnings':warnings}}
    if any(r['currency'] and r['currency'].lower()!='usd' for r in raw_wallets):
        warnings.append('One or more wallets use a currency other than USD. Folio v2 does not convert currencies.')
    out_path.parent.mkdir(parents=True,exist_ok=True)
    out_path.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Created:',out_path)
    print(f'  {csv_count_paid} paid transactions, {len(schedules)} unpaid scheduled items')
    print(f'  {len(categories)} categories (including subcategories), {len(wallets)} wallets')
    print(f'  {len(raw_budgets)} main budgets, {len(raw_limits)} linked category limits')
    if warnings:
        print('  WARNINGS:')
        for w in warnings:print('   -',w)


if __name__=='__main__':
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument('csv',type=Path)
    a.add_argument('sql',type=Path)
    a.add_argument('output',type=Path)
    p=a.parse_args()
    try:main(p.csv,p.sql,p.output)
    except (ValueError,sqlite3.Error,OSError,KeyError) as exc:
        print('Conversion failed:',exc,file=sys.stderr)
        raise SystemExit(1)
