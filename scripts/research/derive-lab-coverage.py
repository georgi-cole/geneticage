"""Reproduce aggregate-only prototype coverage; not an application dependency.

Usage: python scripts/research/derive-lab-coverage.py /path/to/NHANES3.rda
Requires pyreadr and pandas. Input is the BioAge data/NHANES3.rda file at
b1f9fc02f086cd4aa74185f2335ab1366082e7fe. No participant rows are exported.
"""
import hashlib
import json
import sys
from decimal import Decimal, ROUND_FLOOR, ROUND_CEILING
from pathlib import Path

import pyreadr

source = Path(sys.argv[1])
digest = hashlib.sha256(source.read_bytes()).hexdigest()
if digest != 'c1b940fc9614add6effaa3ea6d189677c5cd8532f46be79284dce695ae3e0b92':
    raise ValueError('Source differs from the pinned dataset. Review before updating.')
data = pyreadr.read_r(str(source))['NHANES3']
selected = data.loc[(data.age >= 20) & (data.age <= 84)]
columns = dict(albumin='albumin_gL', creatinine='creat_umol', glucose='glucose_mmol',
               crp='crp', lymphocytes='lymph', mcv='mcv', rdw='rdw', alp='alp', wbc='wbc')
statistics = {}
coverage = {}
for marker, column in columns.items():
    values = selected[column].dropna()
    low, high = float(values.min()), float(values.max())
    statistics[marker] = dict(column=column, n=int(values.count()), minimum=low, maximum=high)
    step = Decimal('1' if marker in ['albumin', 'creatinine', 'alp'] else '0.1')
    # Six significant digits remove binary storage noise before outward rounding.
    lower = (Decimal(format(low, '.6g')) / step).to_integral_value(rounding=ROUND_FLOOR) * step
    upper = (Decimal(format(high, '.6g')) / step).to_integral_value(rounding=ROUND_CEILING) * step
    coverage[marker] = [0 if marker == 'crp' else float(lower), float(upper)]
result = dict(source_commit='b1f9fc02f086cd4aa74185f2335ab1366082e7fe',
              source_sha256=digest, age_filter=[20, 84], source_rows=len(data),
              selected_rows=len(selected), complete_case_filter=False,
              statistics=statistics, derived_coverage=coverage)
output = Path(__file__).resolve().parents[2] / 'design/research/lab-safety-cohort.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print('Wrote aggregate-only metadata to design/research/lab-safety-cohort.json')
